from flask import Flask, request, redirect, render_template, url_for
from werkzeug.utils import secure_filename
from json import loads, dumps
from models import *
from rich import print
from hashlib import sha256
import os

app = Flask(__name__)
app.secret_key = "secret key"
app.config['UPLOAD_FOLDER'] = "static/uploads/"
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # = 16 Mb

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files['file']
    filename = secure_filename(file.filename)
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return dict(status="OK", statuscode=200, data={"url": filename})

@app.route('/')
def home():
    posts = loads(open("static/dbs/publications.json").read())["blog"]
    courses, posts = [Course().db[i] for i in list(Course().db.keys())[-5:]], [posts[i] for i in list(posts.keys())[-9:]] # loading items with defined limit
    return render_template('index.html', courses=courses, posts=posts, getUser=User().get)

@app.route('/bookmarks')
def bookmarks():
    args = [request.args[i] for i in request.args]
    return render_template("bookmarks.html", bookmarks=User().get(args[0]).get("data").get("object").get('bookmarks') or [], getCourse=Course().get, getUser=User().get)

@app.route('/delete')
def delete():
    # /delete?id=<X-ID>
    # /delete?type=bookmark&auth=<USER-AUTH>&id=<X-ID>
    args = [request.args[i] for i in request.args]
    if len(args) == 1:
        if args[0].startswith("u"):
            return User().delete(args[0])
        elif args[0].startswith("c"):
            return Course().delete(args[0])

    elif len(args) > 1:
        if args[0] == "bookmark":
            user = User().get(args[1])
            try:
                user['data']['object']['bookmarks'].remove(args[2])
                result = User().edit(args[1], "bookmarks", user['data']['object']['bookmarks'])
                return {"status": "OK", "statuscode": 200, "data": {"user": result}}
            except KeyError:
                return user

    return {
        "status": "ERROR",
        "statuscode": 400,
        "data": {"message": "invalid input"}
    }

@app.route('/bookmark')
def bookmark():
    # /bookmark?auth=<USER-AUTH>&id=<COURSE-ID>
    args = [request.args[i] for i in request.args]
    user = User().get(args[0])
    user['data']['object']['bookmarks'].append(args[1])
    result = User().edit(args[0], "bookmarks", user['data']['object']['bookmarks'])
    return {"status": "OK", "statuscode": 200, "data": {"user": result}}

@app.route('/course')
def course():
    return render_template("course.html")

@app.route("/getcourse")
def getCourse():
    args = [request.args[i] for i in request.args]
    return Course().get(args[0])['data'].get('object')

@app.route("/getuser")
def getUser():
    args = [request.args[i] for i in request.args]
    return User().get(args[0])['data'].get('object') or {}

@app.route("/report")
def report():
    args = [request.args[i] for i in request.args]
    return Manage().report(args[0], args[1], args[2])

@app.route("/addcart")
def addCart():
    args = [request.args[i] for i in request.args]
    user = User().get(args[0])
    user['data']['object']['cart'].append(args[1])
    result = User().edit(args[0], "cart", user['data']['object']['cart'])
    return {"status": "OK", "statuscode": 200, "data": {"user": result}}

@app.route("/download")
def download():
    args = [request.args[i] for i in request.args]
    user = User().get(args[0])
    if args[1] in user['data']['object']['registed_courses']:
        if len(args) == 3:
            return {"status": "OK", "statuscode": 200, "data": {"url": f"static/assets/courses/{args[1]}/{args[2]}.mp4"}}
        elif len(args) == 2:
            return {"status": "OK", "statuscode": 200, "data": {"url": f"static/assets/courses/{args[1]}/links.txt"}}
        return {"status": "ERROR", "statuscode": 400, "data": {"message": "parameters less/more than minimum"}}
    return {"status": "ERROR", "statuscode": 403, "data": {"message": "the course isn't registered in user's record"}}

@app.route("/getInteractions")
def getInteractions():
    # /getInteractions?auth=<USER-AUTH>&id=<COURSE-ID>
    args = [request.args[i] for i in request.args]
    userInters = User().get(args[0])["data"]["object"]["interactions"]
    ID = args[1]
    inters = {
        "likes": [[],[]],
        "dislikes": [[],[]]
    }

    if ID in userInters["quizzes"]["likes"]: inters["likes"][0] = userInters["quizzes"]["likes"][ID]
    if ID in userInters["comments"]["likes"]:
        inters["likes"][1] = userInters["comments"]["likes"][ID]
    if ID in userInters["quizzes"]["dislikes"]: inters["dislikes"][0] = userInters["quizzes"]["dislikes"][ID]
    if ID in userInters["comments"]["dislikes"]:
        inters["dislikes"][1] = userInters["comments"]["dislikes"][ID]

    return {"status": "OK", "statuscode": 200, "data": {"results": inters}}

@app.route("/like")
def likeComment():
    # /likeComment?auth=<USER-AUTH>&course=<COURSE-ID>&id=<COMMENT-ID>&type=<comments|quizzes>
    args = [request.args[i] for i in request.args]
    user, action, course, comment, Type = User().get(args[0])["data"]["object"], args[1], Course().get(args[2])["data"]["object"], args[3], args[4]
    
    parts = comment.split("-")
    code = f'course["{Type}"][{int(parts[0])-1}]'
    for index in parts[1:]:
        code += f'["{"replies" if Type == "comments" else "answers"}"][{int(index)-1}]'
    if action == "like":
        user["interactions"][Type]["likes"][args[2]].append(comment)
        exec(code + f'["likes"] += 1')
    elif action == "unlike":
        user["interactions"][Type]["likes"][args[2]].remove(comment)
        exec(code + f'["likes"] -= 1')
    elif action == "dislike":
        user["interactions"][Type]["dislikes"][args[2]].append(comment)
        exec(code + f'["dislikes"] += 1')
    elif action == "undislike":
        user["interactions"][Type]["dislikes"][args[2]].remove(comment)
        exec(code + f'["dislikes"] -= 1')
    else:
        return {"status": "OK", "statuscode": 400, "data": {"message": "invalid input"}}

    return {
        "status": "OK",
        "statuscode": 200,
        "data": {
            "user": User().edit(args[0], "interactions", user["interactions"])["data"].get("object"),
            "course": Course().edit(args[2], "comments", course[Type])["data"].get("object")
        }
    }

@app.route("/reaction")
def reaction():
    # /reaction?auth=<USER-AUTH>&course=<COURSE-ID>&type=new&state=<COMMENTS|QUIZZES>&stars=<STARS-LENGTH>&text=<TEXT>
    # /reaction?auth=<USER-AUTH>&course=<COURSE-ID>&type=reply&state=<COMMENTS|QUIZZES>&replyid=<COMMENT-ID>&text=<TEXT>
    args = [request.args[i] for i in request.args]
    user, course, Type, state, arg4, text = User().get(args[0])["data"]["object"], Course().get(args[1])["data"]["object"], args[2], args[3], args[4], args[5]
    stars = int(arg4) if Type == "new" and state == "comments" else None
    ID = str(len(course[state])) if Type == "new" else arg4
    code = f'course["{state}"]'

    if Type == "reply":
        newID = {"id": ID}
        parts = arg4.split("-")
        code = f'course["{state}"][{int(parts[0])-1}]'
        for index in parts[1:]: code += f'["{"replies" if state == "comments" else "answers"}"][{int(index)-1}]'
        code += f'["{"replies" if state == "comments" else "answers"}"]'
        print(code)
        exec(f'newID["id"] = str(arg4)+"-"+str(len({code})+1)')
        ID = newID["id"]

    result = {
        "id": str(ID),
        "user": args[0],
        "stars": stars,
        "likes": 0,
        "dislikes": 0,
        "text": text,
        "datetime": datetime.now().strftime("%Y/%m/%d %H:%M"),
        "is_verified": False,
        "type": arg4,
        "replies" if state == "comments" else "answers": []
    }
    exec(f'{code}.append({result})')
    
    return {
        "status": "OK",
        "statuscode": 200,
        "data": {
            "course": Course().edit(args[1], state, course[state]),
            "manage": Manage().addToQueue("verifications", state, [args[1], ID])
        }
    }

@app.route("/userIsVaild")
def userValidation(uid=None):
    # /userIsVaild?auth=<USER-AUTH>
    args = [request.args[i] for i in request.args] if uid is None else [uid]
    user = User().get(args[0])
    isExist = user["statuscode"] != 404
    isBanned = user["data"]["object"]["is_banned"] if isExist else False
    Type = ("master" if user["data"]["object"]["cv"] != None else user["data"]["object"]["type"]) if isExist else None
    return {"status": "OK", "statuscode": 200, "data": {"is_exist": isExist, "is_banned": isBanned, "type": Type, "is_vaild": isExist and not isBanned}}

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")
    else:
        args = [request.form[i] for i in request.form]
        mode, email, password = args
        
        if mode == "login":
            user = User().db.get(email)
            if user is None:
                return {"status": "ERROR", "statuscode": 404, "data": {"message": "account is not defined"}}
            elif user['is_banned']:
                return {"status": "ERROR", "statuscode": 403, "data": {"message": "account is banned"}}
            else:
                if sha256(password.encode()).hexdigest() == user['password']:
                    return {"status": "OK", "statuscode": 200, "data": {"object": user}}
                else:
                    return {"status": "ERROR", "statuscode": 400, "data": {"message": "entered password is incorrect"}}

        else:
            return User().new(email, password)

@app.route("/log")
def log():
    args = [request.args[i] for i in request.args]
    Type, section, data = args
    return Manage().log(Type+section+data)

@app.route("/editUser")
def editUser():
    args = [request.args[i] for i in request.args]
    return User().edit(*args)

@app.route("/checkPass")
def checkPassword():
    args = [request.args[i] for i in request.args]
    auth, password = args
    user = User().get(auth)["data"]["object"]
    return {"status": "OK", "statuscode": 200, "data": {"is_equal": sha256(password.encode()).hexdigest() == user["password"]}}

@app.route("/search", methods=["GET","POST"])
def search():
    if request.method == "GET":
        return render_template("search.html")
    else:
        args = [request.form[i] for i in request.form]
        Type, data, courses, articles, results = [*args, Course().getAll()['data']['db'], Article().getAll()['data']['db'], []]
        Manage().searched(data)
        if Type == 'q': results = [*[courses[course] for course in courses if data in courses[course]['title']], *[articles[article] for article in articles if data in articles[article]['title']]]
        else: results = [*[courses[course] for course in courses if data in courses[course]['category']], *[articles[article] for article in articles if data in articles[article]['category']]]
        return {"status": "OK", "statuscode": 200, "data": {"results": results}}

@app.route("/dashboard")
def dashboard():
    args = [request.args[i] for i in request.args]
    validate = userValidation(args[0])["data"]
    if validate['is_vaild']:
        user = User().get(args[0])["data"]["object"]
        utype = validate['type']
        if utype == "user": return render_template("user.html", user=user)
        elif utype == "admin": return render_template("manage.html", user=user)
        else: return render_template("admin.html", user=user)
    else:
        return redirect('/register')

@app.route("/article", methods=["GET", "POST"])
def article():
    if request.method == "GET":
        return "TODO"
    else:
        args = [request.form[i] for i in request.form]
        #print (request.json)
        return Article().get(args[0])

@app.route("/likeArticle")
def articleLike():
    args = [request.args[i] for i in request.args]
    auth, action, article, articles = [*args, Article().getAll()["data"]["db"]]
    user, article = User().get(auth)["data"]["object"], Article().get(article)["data"]["object"]
    if action.startswith("un"):
        article[action[2:]+"s"] -= 1
        Article().edit(article["id"], action[2:]+"s", article[action[2:]+"s"])
        user["interactions"]["articles"][action[2:]+"s"].remove(article["id"])
        User().edit(user["id"], "interactions", user["interactions"])
    else:
        article[action+"s"] += 1
        Article().edit(article["id"], action+"s", article[action+"s"])
        user["interactions"]["articles"][action+"s"].remove(article["id"])
        User().edit(user["id"], "interactions", user["interactions"])
    return dict(status="OK", statuscode=200, data={})

if __name__ == "__main__":
    app.run(debug=True)