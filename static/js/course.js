var args = document.location.search.replace("?", "").replace(/\+/g, " ").split("&");
var courseID = args[0].split("=")[0] == "id" ? args[0].split("=")[1].replace(/\+/g, " ") : "undefined";
if (courseID == "undefined") {
    window.history.back();
}
var isBookmarked = GET(`/getuser?id=${user_guid}`);
isBookmarked.bookmarks == undefined ? isBookmarked = false : isBookmarked = isBookmarked.bookmarks.indexOf(courseID) != -1;
isBookmarked ? fab.innerHTML = '<i class="bi bi-bookmark-fill fab-ic"></i>' : fab.innerHTML = '<i class="bi bi-bookmark fab-ic"></i>';;

var course = GET(`/getcourse?id=${courseID}`);
var interactions = user_guid != null ? GET(`/getInteractions?auth=${user_guid}&id=${courseID}`).data.results : {"likes": [[],[]], "dislikes": [[],[]]};

console.log(course);

var setAttr = (className, attr, value) => {
    document.querySelectorAll(`.${className}`).forEach((el) => {
        eval(`el.${attr} = '${value}';`);
    });
};

// CERTIFICATION
setAttr("course-thumbnail", "src", course.thumbnail);
setAttr("course-title", "innerHTML", course.title);
course.master = GET(`/getuser?id=${course.master}`);
setAttr("course-master", "innerHTML", course.master.name);
setAttr("cc-master-cv", "href", course.master.cv);
if (course.price.before_discount != course.price.after_discount) {
    setAttr("cc-price-real", "innerHTML", persianizeNums(separatingNums(course.price.before_discount)));
}
setAttr("cc-price-off", "innerHTML", persianizeNums(separatingNums(course.price.after_discount)));
setAttr("course-students", "innerHTML", persianizeNums(separatingNums(course.students))+" نفر");
setAttr("course-videos", "innerHTML", persianizeNums(course.videos.length)+" ویدیو");
setAttr("course-time", "innerHTML", persianizeNums(course.time));
setAttr("course-level", "innerHTML", course.level);
setAttr("course-status", "innerHTML", course.status);
setAttr("course-lastupdate", "innerHTML", persianizeNums(course.last_update));
setAttr("course-link", "innerHTML", course.shortlink);
setAttr("course-description", "innerHTML", course.description.substr(0, Math.round(course.description.length/2)));

var showReport = () => {
    dialog(
        [
            "var(--color-white);",
            "var(--color-amber);",
            "var(--color-gray-low);",
            "var(--color-gray-strong);"
        ],
        {
            "header": [
                {
                    "icon": "exclamation-triangle",
                    "title": "گزارش"
                },
                {
                    "element": "<button class='bi bi-x btn' id='dialogbtn_hide'></button>"
                }
            ],
            "content": {
                "html": `
<div class="report">
لطفا توضیح دهید که چرا این مورد را خلاف قوانین میدانید:<br>
<input class="dialog-field" type="text" id="report" placeholder="توضیحات بیشتری ارائه دهید..."/>
</div>
                `
            },
            "footer": [
                [],
                [
                    {
                        "type": "success",
                        "id": "done",
                        "text": "ارسال",
                        "event": `report(document.getElementById("report").value);`
                    }
                ]
            ]
        }
    );
};

var report = (description) => {
    if (user_guid != null && description != "") {
        document.getElementById("dialogbtn_hide").click();
        if (GET(`/report?id=${courseID}&user=${user_guid}&reason=${description}`).statuscode == 200) {
            successToast("این دوره با موفقیت گزارش شد");
        }
    } else {
        document.getElementById("dialogbtn_hide").click();
        errorToast("گزارش به علت نقص ورودی ارسال نشد");
    }
}

var shareCourse = async () => {
    const shareData = {
        title: course.title,
        text: `${course.title}\nبا تدریس استاد ${course.master.name} را در «مبی‌لرن» بیاموزید :\n${course.shortlink}`,
        url: course.shortlink
    };

    // Share must be triggered by "user activation"
    try {
        await navigator.share(shareData);
    } catch (err) {
        console.log(err);
    }
};

var copylink = () => {
    navigator.clipboard.writeText(course.shortlink);
    successToast("لینک دوره با موفقیت کپی شد");
};

var courseRegister = () => {
    if (user_guid != null) {
        GET(`/addcart?user=${user_guid}&id=${courseID}`);
        successToast("این دوره به سبد خرید شما افزوده شد", ()=>{goto(Links.register)}, "مشاهده");
    } else {
        errorToast("لطفا ابتدا به اکانت خود وارد شوید", ()=>{goto(Links.register)}, "ورود");
    }
};

var showFullDescription = (btn) => {
    setAttr("course-description", "innerHTML", course.description);
    btn.hidden = true;
};

// DOWNLOADS
document.querySelectorAll(".downloads").forEach((dls) => {
    var sumSize = 0;
    for (var video of course.videos) {
        sumSize += video.size;
        dls.innerHTML += `
<div class="download d-flex">
    <div class="download-rightside d-flex">
        <div class="download-number bold">${persianizeNums(course.videos.indexOf(video)+1)}</div>
        <div class="download-texts">
            <p class="download-title">${video.title}</p>
            <div class="download-info d-flex">
                <p class="download-time"><i class="bi bi-clock-fill"></i> ${persianizeNums(video.time)}</p>
                <p class="download-size"><i class="bi bi-arrow-down-up"></i> ${persianizeNums(video.size)} Mb</p>
                <p class="download-quality"><i class="bi bi-badghe-hd-fill"></i> ${persianizeNums(video.quality)} p</p>
                <p class="download-price-status">${video.isLocked ? '<i class="bi bi-unlock"></i>' : '<i class="bi bi-lock"></i>'}</p>
            </div>
        </div>
    </div>
    <div class="download-leftside d-flex">
        <button class="btn btn-watch" onclick="watch(${course.videos.indexOf(video)});"><i class="bi bi-eye"></i></button>
        <button class="btn btn-download" onclick="download(${course.videos.indexOf(video)});"><i class="bi bi-download"></i></button>
    </div>
</div>
        `;
    }
    setAttr("dlbox-subinfo", "innerHTML", `${persianizeNums(Math.round(sumSize/1024))} گیگابایت (${persianizeNums(sumSize)} مگابایت)`);
});

var watch = (index) => {
    var resp = GET(`/download?auth=${user_guid}&id=${courseID}&index=${index}`);
    if (resp.statuscode == 200) {
        goto(resp.data.url);
    } else if (resp.statuscode == 403) {
        errorToast("شما دانشجوی این دوره نیستید");
    }
}

var download = (index) => {
    var resp = GET(`/download?auth=${user_guid}&id=${courseID}&index=${index}`);
    if (resp.statuscode == 200) {
        goto(resp.data.url, true);
    } else if (resp.statuscode == 403) {
        errorToast("شما دانشجوی این دوره نیستید");
    }
};

var downloadAll = () => {
    var resp = GET(`/download?auth=${user_guid}&id=${courseID}`);
    if (resp.statuscode == 200) {
        goto(resp.data.url);
    } else if (resp.statuscode == 403) {
        errorToast("شما دانشجوی این دوره نیستید");
    }
};

// COMMENTS
var likedComments = interactions.likes[1];
var dislikedComments = interactions.dislikes[1];

function makeComment(comment, getUserIsRequired=true){
    //comment.replies == undefined ? comment.replies = [] : null;
    if (!comment.is_verified) { return ''; }
    var isReply = comment.id.indexOf("-") != -1;
    if (isReply) {
        var repliedTo = comment.id.split("-");
        repliedTo.pop(repliedTo.length - 1);
        repliedTo = repliedTo.join('-');
    }

    var html = `
<div class="course-comment ${isReply ? 'repto_'+repliedTo : ''}" id="c${comment.id}" ${isReply ? 'hidden' : ''}>
    <div class="course-comment-header d-flex">
        <div class="course-comment-header-rightside d-flex">
            <img src="${comment.user.thumbnail}" alt="[AVATAR]" class="course-comment-avatar">
            <div class="course-comment-user">
                <div class="d-flex course-comment-baseinfo">
                    <p class="course-comment-user-name">${comment.user.name}</p>
                    ${comment.stars >= 1 ? `<p class="course-comment-date">( ${persianizeNums(comment.datetime)} )</p>` : ''}
                </div>
                <p class="course-comment-user-stars">${comment.stars >= 1 ? "<i class='bi bi-star-fill comment-star'></i>".repeat(comment.stars) : `<p class="course-comment-date">( ${persianizeNums(comment.datetime)} )</p>`}</p>
            </div>
        </div>
        <div class="course-comment-header-leftside d-flex">
            <div class="course-comment-reactions d-flex">
                <div>
                    <button class="btn btn-comment-like" onclick="likeComment(this.childNodes[0], '${comment.id}');"><i class="bi ${likedComments.indexOf(comment.id) == -1 ? 'bi-hand-thumbs-up' : 'bi-hand-thumbs-up-fill'}"></i></button> <br>
                    <span class="comment-likes" id="likes_c${comment.id}">${persianizeNums(comment.likes)}</span>
                </div>
                <div>
                    <button class="btn btn-comment-dislike" onclick="dislikeComment(this.childNodes[0], '${comment.id}');"><i class="bi ${dislikedComments.indexOf(comment.id) == -1 ? 'bi-hand-thumbs-down' : 'bi-hand-thumbs-down-fill'}"></i></button> <br>
                    <span class="comment-dislikes" id="dislikes_c${comment.id}">${persianizeNums(comment.dislikes)}</span>
                </div>
            </div>
        </div>
    </div>
    <div class="course-comment-content">${comment.text}</div>
        <div class="course-replies d-flex">
            <button class="btn show-replies" onclick="showReplies('${comment.id}')"><i class="bi bi-caret-down"></i> مشاهده پاسخ‌ها (${persianizeNums(comment.replies.length)})</button>
            <button class="btn btn-reply" onclick="makeNewComment('${comment.id}');"><i class="bi bi-reply-fill"></i></button>
    </div>
    <div class="course-comment-replies" id="replies_${comment.id}" hidden>`;
        
        for (var reply of comment.replies) {
            if (getUserIsRequired) {
                reply.user = GET(`/getuser?id=${reply.user}`);
            }
            html += makeComment(reply);
        }
    return html + "</div></div></div>";
}

// inserting json comments as html
var stars = 0;
document.getElementById("comments_count").innerHTML = `${persianizeNums(course.comments.length)} نظر`;
for (var comment of course.comments) {
    stars += comment.stars;
    comment.user = GET(`/getuser?id=${comment.user}`);
    document.getElementById("comments").innerHTML += makeComment(comment);
}

// inserting stars average
document.getElementById("stars").innerHTML = ` (${"<i class='bi bi-star-fill comment-star'></i>".repeat(stars/course.comments.length)}) `;

// filtering comments based on some criterion
var showFilterComments = () => {
    dialog(
                [
            "var(--color-white);",
            "var(--color-primary);",
            "var(--color-gray-low);",
            "var(--color-gray-strong);"
        ],
        {
            "header": [
                {
                    "icon": "funnel",
                    "title": "فیلتر کردن"
                },
                {
                    "element": "<button class='bi bi-x btn' id='dialogbtn_hide'></button>"
                }
            ],
            "content": {
                "html": `
<div class="comment-filters">
    <div class="comment-filter selected-filter" id="default">بدون فیلتر</div>
    <div class="comment-filter" id="popular">محبوب‌ترین ها</div>
    <div class="comment-filter" id="hated">منفورترین ها</div>
    <div class="comment-filter" id="newest">جدیدترین ها</div>
    <div class="comment-filter" id="oldest">قدیمی‌ترین ها</div>
</div>
                `
            },
            "footer": [
                [],
                [
                    {
                        "type": "success",
                        "id": "done",
                        "text": "فیلتر کن",
                        "event": `filterComments(document.getElementsByClassName("selected-filter")[0].id);`
                    }
                ]
            ]
        }
    );
    document.querySelectorAll(".comment-filter").forEach((el) => {
        el.onclick = () => {
            document.querySelectorAll(".comment-filter").forEach((EL) => {
                EL.className = "comment-filter";
            });
            el.className = "comment-filter selected-filter";
        };
    });
};

var defaults = [course.comments, course.quizzes];
var filterComments = (criterion, type="comments") => {
    document.getElementById("dialogbtn_hide").click();
    
    var base = $.extend( true, {}, type == "comments" ? course.comments : course.quizzes);
    var defaultResult = type == "comments" ? defaults[0] : defaults[1];
    var result = [];
   
    switch (criterion) {
        case 'popular':
            result = aggregate(base, "likes", "id", (a,b) => {return a > b ? a : b}).reverse();
            break;

        case 'hated':
            result = aggregate(base, "id", "dislikes", (a,b) => {return a > b ? a : b}).reverse();
            result.forEach((i) => {i.val = i.type});
            break;

        case 'newest':
            result = aggregate(base, "id", "datetime", (a,b) => {
                // Specify date information
                let aDetails = dateSpecifier(a);
                let bDetails = dateSpecifier(b);
                
                // Convert from jalaali to gregorian
                a = jalaali.toGregorian(aDetails.date.year, aDetails.date.month, aDetails.date.day);
                b = jalaali.toGregorian(bDetails.date.year, bDetails.date.month, bDetails.date.day);
                
                // Convert to date format
                a = new Date(a.gy, a.gm, a.gd, aDetails.time.hour, aDetails.time.minute);
                b = new Date(b.gy, b.gm, b.gd, bDetails.time.hour, bDetails.time.minute);
                
                // Return compare dates as result
                return a > b ? a : b;
            }).reverse();
            result.forEach((i) => {i.val = i.type});
            break;

        case 'oldest':
            result = aggregate(base, "id", "datetime", (b,a) => {
                // Specify date information
                let aDetails = dateSpecifier(a);
                let bDetails = dateSpecifier(b);
                
                // Convert from jalaali to gregorian
                a = jalaali.toGregorian(aDetails.date.year, aDetails.date.month, aDetails.date.day);
                b = jalaali.toGregorian(bDetails.date.year, bDetails.date.month, bDetails.date.day);
                
                // Convert to date format
                a = new Date(a.gy, a.gm, a.gd, aDetails.time.hour, aDetails.time.minute);
                b = new Date(b.gy, b.gm, b.gd, bDetails.time.hour, bDetails.time.minute);
                
                // Return compare dates as result
                return a > b ? a : b;
            });
            result.forEach((i) => {i.val = i.type});
            break;

        default:
            let ids = []
            defaultResult.forEach((i) => {ids.push(i.id)});
            result = defaultResult;
    }

    var els = [];
    result.forEach((i) => {
        var cl = type == "comments" ? "c" : "qa_";
        els.push(document.getElementById(cl + i.val).outerHTML);
    });
    document.getElementById(type == "comments" ? "comments" : "quizzes").innerHTML = "";
    els.forEach((el) => {
        document.getElementById(type == "comments" ? "comments" : "quizzes").innerHTML += el;
    });
};

// function to hide/show replies of every comment
var showReplies = (id) => {
    document.getElementById(`replies_${id}`).hidden = !document.getElementById(`replies_${id}`).hidden;
    document.querySelectorAll(`.repto_${id}`).forEach((el) => {
        el.hidden = document.getElementById(`replies_${id}`).hidden
    }); 
};

// functions to like/unlike & dislike/undislike comments
var likeComment = (ic, id) => {
    if (ic.className == "bi bi-hand-thumbs-up-fill") {
        GET(`/like?auth=${user_guid}&action=unlike&course=${courseID}&comment=${id}&type=comments`);
        ic.className = "bi bi-hand-thumbs-up";
        document.getElementById(`likes_c${id}`).innerHTML = persianizeNums(latinizeNums(document.getElementById(`likes_c${id}`).innerHTML) - 1);
    } else {
        GET(`/like?auth=${user_guid}&action=like&course=${courseID}&comment=${id}&type=comments`);
        ic.className = "bi bi-hand-thumbs-up-fill";
        document.getElementById(`likes_c${id}`).innerHTML = persianizeNums(latinizeNums(document.getElementById(`likes_c${id}`).innerHTML) + 1);
        var opposite = ic.parentNode.parentNode.parentNode.childNodes[3].childNodes[1].childNodes[0];
        if (opposite.className == "bi bi-hand-thumbs-down-fill") {
            dislikeComment(opposite, id);
        }
    }
};
var dislikeComment = (ic, id) => {
    if (ic.className == "bi bi-hand-thumbs-down-fill") {
        GET(`/like?auth=${user_guid}&action=undislike&course=${courseID}&id=${id}&type=comments`);
        ic.className = "bi bi-hand-thumbs-down";
        document.getElementById(`dislikes_c${id}`).innerHTML = persianizeNums(latinizeNums(document.getElementById(`dislikes_c${id}`).innerHTML) - 1);
    } else {
        GET(`/like?auth=${user_guid}&action=dislike&course=${courseID}&id=${id}&type=comments`);
        ic.className = "bi bi-hand-thumbs-down-fill";
        document.getElementById(`dislikes_c${id}`).innerHTML = persianizeNums(latinizeNums(document.getElementById(`dislikes_c${id}`).innerHTML) + 1);
        var opposite = ic.parentNode.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[0];
        if (opposite.className == "bi bi-hand-thumbs-up-fill") {
            likeComment(opposite, id);
        }
    }
};

// reply and add comment
var makeNewComment = (replyid=null) => {
    if (replyid == null) {
        id = course.comments.length+1+"";
    }
    dialog(
        [
            "var(--color-white);",
            "var(--color-primary);",
            "var(--color-gray-low);",
            "var(--color-gray-strong);"
        ],
        {
            "header": [
                {
                    "icon": "chat-dots-fill",
                    "title": "ارسال نظر"
                },
                {
                    "element": "<button class='bi bi-x btn' id='dialogbtn_hide'></button>"
                }
            ],
            "content": {
                "html": `
<div class="new-comment">
    ${replyid == null? '<div class="new-comment-stars"><i class="bi bi-star-fill rated star" id="star1"></i><i class="bi bi-star star" id="star2"></i><i class="bi bi-star star" id="star3"></i><i class="bi bi-star star" id="star4"></i><i class="bi bi-star star" id="star5"></i></div>' : ''}
    <textarea cols="30" id="newcomment" onpaste="calcChars(this.value);" onkeyup="calcChars(this.value);" placeholder="نظر خود را بنویسید..."></textarea>
    <div class="chars d-flex">
        <p id="charsleft">۳۰۰</p>
        <p id="allchars">/ ۳۰۰</p>
    </div>
</div>
                `
            },
            "footer": [
                [],
                [
                    {
                        "type": "success",
                        "id": "done",
                        "text": "ارسال",
                        "event": `
                        sendComment(
                            document.querySelectorAll(".rated"),
                            document.getElementById("newcomment").value,
                            "${replyid}"
                        );`
                    }
                ]
            ]
        }
    );
    document.querySelectorAll(".star").forEach((el) => {
        el.onclick = () => {
            rating(el.id);
        };
    });
};

// calculating that value of field don't be upper than specified value
var calcChars = (field) => {
    var left = document.getElementById("charsleft");
    var all = latinizeNums(document.getElementById("allchars").innerHTML.replace(/\/ /g, ""));
    var fieldEl = document.getElementById("newcomment");
    
    left.innerHTML = persianizeNums(all - field.length < 0 ? 0 : all - field.length);
    if (field.length > all) {
        fieldEl.value = field.substring(0, field.length-1);
        
        left.style = "color: var(--color-red);"
        fieldEl.style = "border: 1px solid var(--color-red); animation: shake 100ms;"
    } else {
        left.style = "color: var(--color-gray);"
        fieldEl.style = "border: 1px solid var(--color-gray-low);"
    }
};

// action on every star clicked (when rating new comment)
var rating = (id) => {
    var stars = document.querySelectorAll(".star");
    stars.forEach((el) => {
        if (el.id[4]*1 > id[4]*1) {
            el.className = "bi bi-star star"
        } else {
            el.className = "bi bi-star-fill rated star"
        }
    });
};

// sending comment to the server
var sendComment = async (stars, text, replyid) => {
    if (replyid == 'null') {
        // it's a parent comment
        var result = GET(`/reaction?auth=${user_guid}&course=${courseID}&type=new&state=comments&stars=${stars.length}&text=${text}`);
    } else {
        // it's a reply
        var result = GET(`/reaction?auth=${user_guid}&course=${courseID}&type=reply&state=comments&replyid=${replyid}&text=${text}`);
    }
    document.getElementById("dialogbtn_hide").click();
    if (result.statuscode == 200) {
        await successToast("نظر شما در دست بررسی است");
    } else {
        await errorToast(`خطای ${result.statuscode}`);
    }
    reloadTemp('course-comments');
};

// QUIZZES
var likedAnswers = interactions.likes[0];
var dislikedAnswers = interactions.dislikes[0];

var [qcount, acount] = [course.quizzes.length, 0];

var loadQuizzes = (node) => {
    if (!node.is_verified) { return ''; }
    node.answers == undefined ? node.answers = [] : null;
    var HTML = `
<div class="course-comment" id="qa_${node.id}">
    <div class="course-comment-header d-flex">
        <div class="course-comment-header-rightside d-flex">
            <img src="${node.user.thumbnail}" alt="[AVATAR]" class="course-comment-avatar">
            <div class="course-comment-user">
                <div class="course-comment-baseinfo d-flex">
                    <p class="course-comment-user-name">${node.user.name}</p>
                    ${node.id.split("-").length == 1 ? `<p class="course-comment-date"> (${persianizeNums(node.datetime)}) </p>` : `` }
                </div>
                ${node.id.split("-").length != 1 ? `<p class="course-comment-date"> (${persianizeNums(node.datetime)}) </p>` : `<div class="course-comment-user-quiztype ${node.type}-quiztype">${node.type == "important" ? "فوری" : node.type == "middle" ? "متوسط" : "عادی"}</div>` }
            </div>
        </div>
        <div class="course-comment-header-leftside d-flex">
            ${node.id.split("-").length == 1 ? `` : `
                <div class="course-comment-reactions d-flex">
                    <div>
                        <button class="btn btn-comment-like" onclick="likeAnswer(this.childNodes[0], '${node.id}');"><i class="bi ${likedAnswers.indexOf(node.id) == -1 ? 'bi-hand-thumbs-up' : 'bi-hand-thumbs-up-fill'}"></i></button> <br>
                        <span class="comment-likes" id="likes_qa${node.id}">${persianizeNums(node.likes)}</span>
                    </div>
                    <div>
                        <button class="btn btn-comment-dislike" onclick="dislikeAnswer(this.childNodes[0], '${node.id}');"><i class="bi ${dislikedAnswers.indexOf(node.id) == -1 ? 'bi-hand-thumbs-down' : 'bi-hand-thumbs-down-fill'}"></i></button> <br>
                        <span class="comment-dislikes" id="dislikes_qa${node.id}">${persianizeNums(node.dislikes)}</span>
                    </div>
                </div>
            `}
        </div>
    </div>
    <div class="course-comment-content">${node.text}</div>
    <div class="course-replies d-flex">
        <button class="btn show-replies" onclick="showAnswers('${node.id}');"><i class="bi bi-caret-down"></i> مشاهده پاسخ‌ها (${persianizeNums(node.answers.length)})</button>
        <button class="btn btn-reply open-quiz" onclick="makeNewQA('${node.id}');"><i class="bi bi-reply-fill"></i></button>
    </div>
    <div class="course-comment-replies" id="answers_${node.id}" hidden>`;
    
    // loading answers of current node
    for (var answer of node.answers) {
        acount++;
        answer.user = GET(`/getuser?id=${answer.user}`);
        HTML += loadQuizzes(answer);
    }

    return HTML + '</div></div>';
};
// nums & inserting loaded json into html
for (var quiz of course.quizzes) {
    quiz.user = GET(`/getuser?id=${quiz.user}`);
    document.getElementById("quizzes").innerHTML += loadQuizzes(quiz);
}
var percent = (acount * 100) / qcount;
document.getElementById("qa_nums").innerHTML = `${persianizeNums(qcount)} پرسش / ${persianizeNums(acount)} پاسخ`;
document.getElementById("qa_percent").innerHTML = ` (${persianizeNums(Math.round(percent))}٪)`;

// filter
var showFilterQuizzes = () => {
    dialog(
        [
            "var(--color-white);",
            "var(--color-primary);",
            "var(--color-gray-low);",
            "var(--color-gray-strong);"
        ],
        {
            "header": [
                {
                    "icon": "funnel",
                    "title": "فیلتر کردن"
                },
                {
                    "element": "<button class='bi bi-x btn' id='dialogbtn_hide'></button>"
                }
            ],
            "content": {
                "html": `
<div class="comment-filters">
    <div class="comment-filter selected-filter" id="default">بدون فیلتر</div>
    <div class="comment-filter" id="newest">جدیدترین ها</div>
    <div class="comment-filter" id="oldest">قدیمی‌ترین ها</div>
</div>
                `
            },
            "footer": [
                [],
                [
                    {
                        "type": "success",
                        "id": "done",
                        "text": "فیلتر کن",
                        "event": `filterComments(
                            document.getElementsByClassName("selected-filter")[0].id,
                            "quizzes"
                        );`
                    }
                ]
            ]
        }
    );
    document.querySelectorAll(".comment-filter").forEach((el) => {
        el.onclick = () => {
            document.querySelectorAll(".comment-filter").forEach((EL) => {
                EL.className = "comment-filter";
            });
            el.className = "comment-filter selected-filter";
        };
    });
};

// new quiz
var makeNewQA = (replyid=null) => {
    if (replyid == null) {
        id = course.quizzes.length+1+"";
    }
    dialog(
        [
            "var(--color-white);",
            "var(--color-primary);",
            "var(--color-gray-low);",
            "var(--color-gray-strong);"
        ],
        {
            "header": [
                {
                    "icon": "question-circle",
                    "title": `ارسال ${replyid == null? 'پرسش' : 'پاسخ'}`
                },
                {
                    "element": "<button class='bi bi-x btn' id='dialogbtn_hide'></button>"
                }
            ],
            "content": {
                "html": `
<div class="new-comment">
    ${replyid == null? '<div class="new-quiz-type d-flex"><div class="course-comment-user-quiztype addquiztype normal-quiztype selected-quiztype" id="normal">عادی</div><div class="course-comment-user-quiztype addquiztype middle-quiztype" id="middle">متوسط</div><div class="course-comment-user-quiztype addquiztype important-quiztype" id="important">فوری</div></div>' : ''}
    <textarea cols="30" id="newcomment" onpaste="calcChars(this.value);" onkeyup="calcChars(this.value);" placeholder="چیزی بنویسید..."></textarea>
    <div class="chars d-flex">
        <p id="charsleft">۳۰۰</p>
        <p id="allchars">/ ۳۰۰</p>
    </div>
</div>
                `
            },
            "footer": [
                [],
                [
                    {
                        "type": "success",
                        "id": "done",
                        "text": "ارسال",
                        "event": `
                        sendQuiz(
                            document.getElementsByClassName("selected-quiztype")[0] != undefined ? document.getElementsByClassName("selected-quiztype")[0].id : "null",
                            document.getElementById("newcomment").value,
                            "${replyid}"
                        );`
                    }
                ]
            ]
        }
    );
    document.querySelectorAll(".addquiztype").forEach((el) => {
        el.onclick = () => {
            var selected = document.getElementsByClassName("selected-quiztype")[0];
            selected.className = selected.className.replace(/ selected-quiztype/g, "");
            el.className += " selected-quiztype";
        };
    });
};

// sending quiz to the server
var sendQuiz = async (type, text, replyid) => {
    if (replyid == 'null') {
        // it's a parent comment
        var result = GET(`/reaction?auth=${user_guid}&course=${courseID}&mode=new&state=quizzes&type=${type}&text=${text}`);
    } else {
        // it's a reply
        var result = GET(`/reaction?auth=${user_guid}&course=${courseID}&mode=reply&state=quizzes&replyid=${replyid}&text=${text}`);
    }
    document.getElementById("dialogbtn_hide").click();
    if (result.statuscode == 200) {
        await successToast("پرسش/پاسخ شما در دست بررسی است");
        [qcount, acount] = [course.quizzes.length,0]
        course = result.data.course.data.object;
        document.getElementById("quizzes").innerHTML = "";
        for (var quiz of course.quizzes) {
            quiz.user = GET(`/getuser?id=${quiz.user}`);
            document.getElementById("quizzes").innerHTML += loadQuizzes(quiz);
        }
        var percent = (acount * 100) / qcount;
        document.getElementById("qa_nums").innerHTML = `${persianizeNums(qcount)} پرسش / ${persianizeNums(acount)} پاسخ`;
        document.getElementById("qa_percent").innerHTML = ` (${persianizeNums(Math.round(percent))}٪)`;
    } else {
        await errorToast(`خطای ${result.statuscode}`);
    }
};

// show answers
var showAnswers = (id) => {
    document.getElementById(`answers_${id}`).hidden = !document.getElementById(`answers_${id}`).hidden;
};

// like/dislike answer
var likeAnswer = (ic, id) => {
    if (ic.className == "bi bi-hand-thumbs-up-fill") {
        GET(`/like?auth=${user_guid}&action=unlike&course=${courseID}&id=${id}&type=quizzes`);
        ic.className = "bi bi-hand-thumbs-up";
        document.getElementById(`likes_qa${id}`).innerHTML = persianizeNums(latinizeNums(document.getElementById(`likes_qa${id}`).innerHTML) - 1);
    } else {
        GET(`/like?auth=${user_guid}&action=like&course=${courseID}&id=${id}&type=quizzes`);
        ic.className = "bi bi-hand-thumbs-up-fill";
        document.getElementById(`likes_qa${id}`).innerHTML = persianizeNums(latinizeNums(document.getElementById(`likes_qa${id}`).innerHTML) + 1);
        var opposite = ic.parentNode.parentNode.parentNode.childNodes[3].childNodes[1].childNodes[0];
        if (opposite.className == "bi bi-hand-thumbs-down-fill") {
            dislikeAnswer(opposite, id);
        }
    }
};
var dislikeAnswer = (ic, id) => {
    if (ic.className == "bi bi-hand-thumbs-down-fill") {
        GET(`/like?auth=${user_guid}&action=undislike&course=${courseID}&id=${id}&type=quizzes`);
        ic.className = "bi bi-hand-thumbs-down";
        document.getElementById(`dislikes_qa${id}`).innerHTML = persianizeNums(latinizeNums(document.getElementById(`dislikes_qa${id}`).innerHTML) - 1);
    } else {
        GET(`/like?auth=${user_guid}&action=dislike&course=${courseID}&id=${id}&type=quizzes`);
        ic.className = "bi bi-hand-thumbs-down-fill";
        document.getElementById(`dislikes_qa${id}`).innerHTML = persianizeNums(latinizeNums(document.getElementById(`dislikes_qa${id}`).innerHTML) + 1);
        var opposite = ic.parentNode.parentNode.parentNode.childNodes[1].childNodes[1].childNodes[0];
        if (opposite.className == "bi bi-hand-thumbs-up-fill") {
            likeAnswer(opposite, id);
        }
    }
};

// FAB
function bookmark(fab) {
    if (isBookmarked) {
        GET(`/delete?type=bookmark&auth=${user_guid}&id=${courseID}`);
        fab.innerHTML = '<i class="bi bi-bookmark fab-ic"></i>';
    } else {
        GET(`/bookmark?auth=${user_guid}&id=${courseID}`);
        fab.innerHTML = '<i class="bi bi-bookmark-fill fab-ic"></i>';
    }
    reloadTemp('fab');
}