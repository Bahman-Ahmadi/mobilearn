from jdatetime import datetime
from json import loads, dumps
from hashlib import sha256
from random import choice
from requests import get

base_domain = "mobilearn.ir"

class BaseModel:
    def __init__(self, db:str):
        self.db_path = db
        self.db:dict = loads(open(self.db_path).read())

    def get(self, guid:str) -> dict :
        guids = [self.db[i]['id'] for i in self.db]
        return {"status": "OK", "statuscode": 200, "data": {"object": self.db[list(self.db.keys())[guids.index(guid)]]}} if guid in guids else {"status": "ERROR", "statuscode": 404, "data": {"message": "object not found"}}

    def getAll(self) -> dict:
        return {"status": "OK", "statuscode": 200, "data": {"db": self.db}}

    def makeGUID(self, start_char:str, length:int=32) -> str:
        choices = [*"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"]
        selected = start_char + "".join([choice(choices) for i in range(length - len(start_char))])
        while self.get(selected)["statuscode"] != 404 :
            # make a new UUID while this UUID is exist in table
            selected = start_char + "".join([choice(choices) for i in range(length - len(start_char))])
        return selected

    def delete(self, guid:str):
        if self.db.get(guid) != None:
            self.db.pop(guid)
            with open(self.db_path, "w") as writer: writer.write(dumps(self.db, indent=4, ensure_ascii=False))
            return {"status": "OK", "statuscode": 200, "data": {}}
        return {"status": "ERROR", "statuscode": 404, "data": {"message": "object not found"}}

    def edit(self, guid:str, key:str, value:any) -> dict:
        for user in self.db.keys():
            if self.db[user]['id'] == guid:
                self.db[user][key] = value
                with open(self.db_path, "w") as writer: writer.write(dumps(self.db, indent=4, ensure_ascii=False))
                return {"status": "OK", "statuscode": 200, "data": {"object": self.db[user]}}
        return {"status": "ERROR", "statuscode": 404, "data": {"message": "object not found"}}

class Manage:
    def __init__(self):
        self.db = loads(open("static/dbs/manage.json").read())

    def addToQueue(self, section:str, key:str, value:any) -> dict:
        self.db[section][key].append(value)
        with open("static/dbs/manage.json", "w") as writer: writer.write(dumps(self.db, indent=4, ensure_ascii=False))
        return dict(status="OK", statuscode=200, data={})

    def report(self, ID:str, reporter:str, reason:str) -> dict:
        return Manage().addToQueue(self, "verifications", "reports", {
            "id": ID,
            "reason": reason,
            "user": reporter
        })

    def searched(self, query:str) -> dict:
        self.db["statistics"]["searchs"][query] = (self.db["statistics"]["searchs"].get(query) or 0) + 1
        with open("static/dbs/manage.json", "w") as writer: writer.write(dumps(self.db, indent=4, ensure_ascii=False))
        return dict(status="OK", statuscode=200, data={})

    def log(self, text:str) -> dict:
        return Manage().addToQueue(self, "records", "logs", {
            "text": text,
            "datetime": datetime.now().strftime("%Y/%m/%d %H:%M")
        })

class User(BaseModel):
    def __init__(self):
        super().__init__("static/dbs/accounts.json")

    def new(self, email:str, password:str) -> dict:
        if not email in self.db.keys():
            ID = self.makeGUID('u')
            self.db[email] = {
                "id": ID,
                "type": "user",
                "name": f"کاربر {len(self.db)+1}",
                "email": email,
                "password": sha256(password.encode()).hexdigest(),
                "wallet": {
                    "left": 0,
                    "actions": []
                },
                "thumbnail": "../static/assets/user.png",
                "bookmarks": [],
                "registed_courses": [],
                "notifs": [],
                "cart": [],
                "interactions": {
                    "articles": {
                        "likes": [],
                        "dislikes": []
                    },
                    "courses": {
                        "likes": [],
                        "dislikes": []
                    },
                    "comments": {
                        "likes": [],
                        "dislikes": []
                    }
                },
                "blog": {
                    "posts": [],
                    "followers": [],
                    "followings": []
                },
                "is_banned": False,
                "pub_courses": [],
                "cv": "",
                "accesses": []
            }
            with open("static/dbs/accounts.json", "w") as writer: writer.write(dumps(self.db, indent=4, ensure_ascii=False))
            return {"status": "OK", "statuscode": 200, "data": {"object": self.db[email]}}
        else:
            return {"status": "OK", "statuscode": 302, "data": {"message": "user is already exists"}}

class Course(BaseModel):
    def __init__(self):
        super().__init__("static/dbs/publications.json")
        self.All = self.db
        self.db = self.db["courses"]

    def new(self, inputs):
        '''
        inputs:
            - thumbnail : str
            - title : str
            - master : str
            - price : int
            - level : str
            - description : str
            - category : str
        '''
        guid = self.makeGUID('c')
        self.db[guid] = {
            "id": guid,
            "thumbnail": inputs["thumbnail"],
            "title": inputs["title"],
            "master": inputs["master"],
            "price": {
                "before_discount": inputs["price"],
                "after_discount": inputs["price"]
            },
            "students": 0,
            "videos": [],
            "comments": [],
            "quizzes": [],
            "time": "0:00:00",
            "level": inputs["level"],
            "status": "در حال برگزاری",
            "last_update": datetime.now().strftime("%Y/%m/%d %H:%M"),
            "shortlink": get(f"https://rizy.ir/api?api=bae7206c5c017f0537a30660fcdec85027fbf686&url={base_domain}/course?id={guid}&format=text").text,
            "description": inputs["description"],
            "category": input["category"],
            "is_verified": False
        }
        with open("static/dbs/publications.json", "w") as writer: writer.write(dumps(self.db, indent=4, ensure_ascii=False))
        Manage().addToQueue("verifications", "new_courses", guid)

    def edit(self, guid:str, key:str, value:any) -> dict:
        for course in self.db.keys():
            if self.db[course]['id'] == guid:
                self.db[course][key] = value
                with open(self.db_path, "w") as writer: writer.write(dumps({"courses": self.db, "blog": self.All["blog"]}, indent=4, ensure_ascii=False))
                return {"status": "OK", "statuscode": 200, "data": {"object": self.db[course]}}
        return {"status": "ERROR", "statuscode": 404, "data": {"message": "object not found"}}

class Article(BaseModel):
    def __init__(self):
        super().__init__("static/dbs/publications.json")
        self.All = self.db
        self.db = self.db["blog"]

    def new(self, inputs):
        '''
        inputs:
            - thumbnail : str
            - title : str
            - author : str
            - html : str
            - category : str
        '''
        guid = self.makeGUID('a')
        self.db[guid] = {
            "id": guid,
            "thumbnail": inputs["thumbnail"],
            "title": inputs["title"],
            "datetime": datetime.now().strftime("%Y/%m/%d %H:%M"),
            "author": inputs["author"],
            "views": 1,
            "likes": 0,
            "dislikes": 0,
            "shortlink": get(f"https://rizy.ir/api?api=bae7206c5c017f0537a30660fcdec85027fbf686&url={base_domain}/article?id={guid}&format=text").text,
            "comments": [],
            "html": inputs["html"],
            "category": inputs["category"],
            "is_verified": False
        }
        with open("static/dbs/publications.json", "w") as writer: writer.write(dumps(self.db, indent=4, ensure_ascii=False))
        Manage().addToQueue("verifications", "new_articles", guid)

    def edit(self, guid:str, key:str, value:any) -> dict:
        for article in self.db.keys():
            if self.db[article]['id'] == guid:
                self.db[article][key] = value
                with open(self.db_path, "w") as writer: writer.write(dumps({"courses": self.All["courses"], "blog": self.db}, indent=4, ensure_ascii=False))
                return {"status": "OK", "statuscode": 200, "data": {"object": self.db[article]}}
        return {"status": "ERROR", "statuscode": 404, "data": {"message": "object not found"}}