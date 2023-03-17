// show different welcome messages by every load
const welcomes = ["وقت بخیر،", "سلام و درود،", "خوش اومدی،", "خوشحالم از دیدنت،"];
document.getElementById("welcome").innerHTML = welcomes[Math.floor(Math.random()*welcomes.length)];

var me = GET(`/getuser?id=${user_guid}`);

// edit information (name/pass/avatar)
var showEditProfile = () => {
	dialog(
		[
			"var(--color-white);",
			"var(--color-primary-strong);",
			"var(--color-gray-low);",
			"var(--color-gray-strong);"
		],
		{
			"header": [
				{
					"icon": "pencil",
					"title": "ویرایش نمایه"
				},
				{
					"element": "<button class='btn' id='dialogbtn_hide'><i class='bi bi-x'></i></button>"
				}
			],
			"content": {
				"html": `
<div class="edit-profile">
	<p class="editprofile-info">مواردی را که می‌خواهید، تغییر دهید</p>
	<div class="avatars">
		<img src="${me.thumbnail}" class="avatar selected-avatar"/>
		<img src="static/assets/user.png" class="avatar"/>
		<img src="static/assets/user.png" class="avatar"/>
		<img src="static/assets/user.png" class="avatar"/>
		<img src="static/assets/user.png" class="avatar"/>
		<img src="static/assets/user.png" class="avatar"/>
		<img src="static/assets/user.png" class="avatar"/>
		<label class="add-avatar" for="myavatar"><i class="bi bi-plus-circle-dotted"></i></label>
		<input type="file" name="myavatar" class="avatar" id="myavatar" hidden/>
	</div>
	<div class="inputs">
		<input type="text" class="dialog-field name-input" id="name" placeholder="نام و نام خانوادگی خود را وارد کنید"/><br>
		<input type="password" class="dialog-field oldpass-input" id="oldpass" placeholder="رمزعبور قدیمی"/>
		<input type="password" class="dialog-field newpass-input" id="newpass" placeholder="رمزعبور جدید"/>
	</div>
</div>
				`
			},
			"footer": [
				[],
				[
					{
						"type": "danger",
						"id": "cancel",
						"text": "لغو",
						"event": `document.getElementById("dialogbtn_hide").click();`
					},
					{
						"type": "success",
						"id": "done",
						"text": "اعمال تغییرات",
						"event": `editProfile(
							document.getElementById("name").value,
							document.getElementById("oldpass").value,
							document.getElementById("newpass").value,
							document.getElementsByClassName("selected-avatar")[0].src.replace(/${window.location.origin.replace(/\//g, "\\/")}/g, "")
						);`
					}
				]
			]
		}
	);
	document.querySelectorAll(".avatar").forEach((el) => {
		el.onclick = () => {
			document.querySelectorAll(".avatar").forEach((other) => {
				other.className = "avatar";
			});
			el.className = "avatar selected-avatar";
		};
	});
};
function editProfile(name, oldpass, newpass, avatar) {
	document.getElementById("dialogbtn_hide").click();
	if (name != '' && name != me.name) {
	    if (GET(`/editUser?id=${user_guid}&key=name&value=${name}`).statuscode == 200) {
	        successToast('نام باموفقیت تغییر یافت');
	    }
	}
	if (oldpass != '' && newpass != '') {
	    if (GET(`/checkPass?auth=${user_guid}&pass=${oldpass}`).data.is_equal) {
	        if (GET(`/editUser?id=${user_guid}&key=password&value=${newpass}`).statuscode == 200) {
	            successToast('رمزعبور باموفقیت تغییر یافت');
	        } else {
	            errorToast('رمزعبور تغییر نیافت');
	        }
	    } else {
	        errorToast('رمزعبور قدیمی نادرست است');
	    }
	}
	if (avatar != me.thumbnail) {
	    if (GET(`editUser?id=${user_guid}&key=thumbnail&value=${avatar.indexOf("static") == -1 ? Links.uploads + avatar : avatar}`).statuscode == 200) {
	        successToast('عکس پروفایل با موفقیت تغییر یافت');
	    } else {
	        errorToast('عکس پروفایل تغییر نیافت');
	    }
	}
	me = GET(`/getuser?id=${user_guid}`);
	reloadTemp("profile");
}

// show notifications
var showNotifs = () => {
    var html;
    for (var notif of me.notifs) {
        html += `
<div class="notif">
	<div class="notif-topside d-flex">
		<div class="notif-toprightside">
			پیام سیستم (${persianizeNums(notif.datetime)})
		</div>
		<div class="notif-topleftside"></div>
	</div>
	<div class="notif-bottomside">
		${notif.text}
	</div>
</div>
        `;
    }
	dialog(
		[
			"var(--color-white);",
			"var(--color-amber-strong);",
			"var(--color-gray-low);",
			"var(--color-gray-strong);"
		],
		{
			"header": [
				{
					"icon": "bell",
					"title": "اعلانات"
				},
				{
					"element": "<button class='btn' id='dialogbtn_hide'><i class='bi bi-x'></i></button>"
				}
			],
			"content": {
				"html": `<div class="notifs">${html}</div>`
			},
			"footer": [
				[],
				[
					{
						"type": "success",
						"id": "done",
						"text": "حله",
						"event": `document.getElementById("dialogbtn_hide").click();`
					}
				]
			]
		}
	);
};

// change theme
var changeTheme = () => {
	localStorage.setItem("theme", localStorage.getItem("theme") == "light" ? "dark" : "light");
	var theme = localStorage.getItem("theme") == null ? "light" : localStorage.getItem("theme");
	document.head.innerHTML += `<link rel="stylesheet" href="dist/css/vars-${theme}.css"/>`;
};
document.getElementById("theme").onclick = changeTheme;

// liked posts
var showLikedPosts = () => {
	var html;
	for (var favpost of me.interactions.articles.likes) {
	    favpost = POST("/article", {"id": favpost}).data.object;
	    html += `
<div class="liked-post d-flex">
	<div class="liked-post-rightside d-flex">
		<img class="liked-post-thumbnail" src="${favpost.thumbnail}" alt="thumbnail"/>
		<div class="liked-post-texts">
			<p class="liked-post-title">${favpost.title}</p>
			<p class="bi bi-person liked-post-author"> ${GET(`/getuser?id=${favpost.author}`).name}</p>
		</div>
	</div>
	<div class="liked-post-leftside d-flex">
		<button class="bi bi-trash btn btn-unlike-likedpost" onclick="unlikePost(this, '${favpost.id}');"></button>
		<button class="bi bi-caret-left btn btn-goto-likedpost" onclick="goto(Links.blog.post+'${favpost.id}');"></button>
	</div>
</div>
	    `
	}
	dialog(
		[
			"var(--color-white);",
			"var(--color-red-strong);",
			"var(--color-red-low);",
			"var(--color-gray-strong);"
		],
		{
			"header": [
				{
					"icon": "heart-fill",
					"title": "مطالب محبوب"
				},
				{
					"element": "<button class='btn' id='dialogbtn_hide'><i class='bi bi-x'></i></button>"
				}
			],
			"content": {
				"html": `<div class="liked-posts">${html}</div>`
			},
			"footer": [
				[],
				[
					{
						"type": "success",
						"id": "done",
						"text": "حله",
						"event": `document.getElementById("dialogbtn_hide").click();`
					}
				]
			]
		}
	);
};
function unlikePost(el, postID) {
	// delete liked post from UI
	el.parentNode.parentNode.remove();
	GET(`/likeArticle?auth=${user_guid}&action=unlike&article=${postID}`);
}

// wallet
var showWallet = () => {
	// todo: load wallet reports from XHR then replace that instance of <dialog.contents.content.html>
	dialog(
		[
			"var(--color-white);",
			"var(--color-green-strong);",
			"var(--color-green-low);",
			"var(--color-gray-strong);"
		],
		{
			"header": [
				{
					"icon": "wallet2",
					"title": "کیف پول (۱۰,۰۰۰ تومان)"
				},
				{
					"element": "<button class='btn' id='dialogbtn_hide'><i class='bi bi-x'></i></button>"
				}
			],
			"content": {
				"html": `
<div class="wallet-operations d-flex">
	<button class="btn wallet-operation-charge" onclick="chargingPage();"><i class="bi bi-plus"></i> شارژ</button>
	<button class="btn wallet-operation-cash" onclick="cashingPage();"><i class="bi bi-cash"></i> برداشت</button>
</div>
<div class="wallet-reports">
	<div class="wallet-report d-flex">
		<div class="walletreport-rightside d-flex">
			<div class="bi bi-arrow-up reporttype-ic reporttype-pay"></div>
			<div class="walletreport-info">
				<p class="walletreport-type reporttype-pay">پرداخت</p>
				<p class="walletreport-value">مقدار: ۲۰,۰۰۰ تومان</p>
				<p class="walletreport-leftover">باقی‌مانده: ۱۰,۰۰۰ تومان</p>
			</div>
		</div>
		<div class="walletreport-leftside">
			<p class="walletreport-datetime">۱۴۰۱/۱۰/۱۴ ۲۰:۱۲:۲۱</p>
		</div>
	</div>
	<div class="wallet-report d-flex">
		<div class="walletreport-rightside d-flex">
			<div class="bi bi-arrow-down reporttype-ic reporttype-charge"></div>
			<div class="walletreport-info">
				<p class="walletreport-type reporttype-charge">شارژ</p>
				<p class="walletreport-value">مقدار: ۱۰,۰۰۰ تومان</p>
				<p class="walletreport-leftover">باقی‌مانده: ۱۰,۰۰۰ تومان</p>
			</div>
		</div>
		<div class="walletreport-leftside">
			<p class="walletreport-datetime">۱۴۰۱/۱۰/۱۳ ۲۰:۱۲:۲۱</p>
		</div>
	</div>
	<div class="wallet-report d-flex">
		<div class="walletreport-rightside d-flex">
			<div class="bi bi-cash reporttype-ic reporttype-cash"></div>
			<div class="walletreport-info">
				<p class="walletreport-type reporttype-cash">برداشت</p>
				<p class="walletreport-value">مقدار: ۱۰۰,۰۰۰ تومان</p>
				<p class="walletreport-leftover">باقی‌مانده: ۱۰,۰۰۰ تومان</p>
			</div>
		</div>
		<div class="walletreport-leftside">
			<p class="walletreport-datetime">۱۴۰۱/۱۰/۱۲ ۲۰:۱۲:۲۱</p>
		</div>
	</div>
	<div class="wallet-report d-flex">
		<div class="walletreport-rightside d-flex">
			<div class="bi bi-arrow-up reporttype-ic reporttype-pay"></div>
			<div class="walletreport-info">
				<p class="walletreport-type reporttype-pay">پرداخت</p>
				<p class="walletreport-value">مقدار: ۲۰,۰۰۰ تومان</p>
				<p class="walletreport-leftover">باقی‌مانده: ۱۰,۰۰۰ تومان</p>
			</div>
		</div>
		<div class="walletreport-leftside">
			<p class="walletreport-datetime">۱۴۰۱/۱۰/۱۴ ۲۰:۱۲:۲۱</p>
		</div>
	</div>
	<div class="wallet-report d-flex">
		<div class="walletreport-rightside d-flex">
			<div class="bi bi-arrow-down reporttype-ic reporttype-charge"></div>
			<div class="walletreport-info">
				<p class="walletreport-type reporttype-charge">شارژ</p>
				<p class="walletreport-value">مقدار: ۱۰,۰۰۰ تومان</p>
				<p class="walletreport-leftover">باقی‌مانده: ۱۰,۰۰۰ تومان</p>
			</div>
		</div>
		<div class="walletreport-leftside">
			<p class="walletreport-datetime">۱۴۰۱/۱۰/۱۳ ۲۰:۱۲:۲۱</p>
		</div>
	</div>
	<div class="wallet-report d-flex">
		<div class="walletreport-rightside d-flex">
			<div class="bi bi-cash reporttype-ic reporttype-cash"></div>
			<div class="walletreport-info">
				<p class="walletreport-type reporttype-cash">برداشت</p>
				<p class="walletreport-value">مقدار: ۱۰۰,۰۰۰ تومان</p>
				<p class="walletreport-leftover">باقی‌مانده: ۱۰,۰۰۰ تومان</p>
			</div>
		</div>
		<div class="walletreport-leftside">
			<p class="walletreport-datetime">۱۴۰۱/۱۰/۱۲ ۲۰:۱۲:۲۱</p>
		</div>
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
						"text": "حله",
						"event": `document.getElementById("dialogbtn_hide").click();`
					}
				]
			]
		}
	);
};
function chargingPage() {
	dialog(
		[
			"var(--color-white);",
			"var(--color-green-strong);",
			"var(--color-green-low);",
			"var(--color-gray-strong);"
		],
		{
			"header": [
				{
					"icon": "plus-circle",
					"title": "شارژ کیف‌پول"
				},
				{
					"element": "<button class='btn' id='dialogbtn_hide'><i class='bi bi-x'></i></button>"
				}
			],
			"content": {
				"html": `
<div class="charge-container">
	<div class="charge-input-container d-flex">
		<input class="dialog-field" type="number" id="payvalue" onkeyup="payValueController(this.value);" value="10000" placeholder="مقدار شارژ موردنظر را وارد کنید"/>
		<div class="charge-controllers">
			<button class="bi bi-plus btn btn-increase-charge" onclick="payValueController(document.getElementById('payvalue').value*1 + 1000);"></button> <br>
			<button class="bi bi-dash btn btn-decrease-charge" onclick="payValueController(document.getElementById('payvalue').value*1 - 1000);"></button>
		</div>
	</div>
	<p class="bold" id="finalAmount">قابل پرداخت (%10+): 11,000 تومان</p>
</div>
				`
			},
			"footer": [
				[
					{
						"type": "info",
						"id": "help",
						"text": "راهنما",
						"event": `showPayHelp();`
					}
				],
				[
					{
						"type": "danger",
						"id": "cancel",
						"text": "لغو",
						"event": `document.getElementById("dialogbtn_hide").click();`
					},
					{
						"type": "success",
						"id": "done",
						"text": "پرداخت",
						"event": `goto(Links.pay+document.getElementById("payvalue").value);document.getElementById("dialogbtn_hide").click();`
					}
				]
			]
		}
	);
}
function payValueController(value) {
	var input = document.getElementById("payvalue");
	var finalAmount = document.getElementById("finalAmount");
	value *= 1;
	value < 10000 ? input.value = "10000" : value > 1000000 ? input.value = "1000000" : input.value = value;
	value = input.value*1;
	finalAmount.innerHTML = "قابل پرداخت (%10+): "+ separatingNums(value + (value / 10)) + " تومان";
}
function showPayHelp() {
	infoDialog(
		"راهنما",
		"برای تعیین وجه شارژ لازم است که مقدار مورد نظر بین ۱۰ هزارتومان تا ۱ میلیون تومان باشد. همچنین ۱۰ درصد به عنوان کارمزد، به مقدار موردنظر افزوده می‌شود."
	);
}
function cashingPage() {
	dialog(
		[
			"var(--color-white);",
			"var(--color-bluegray);",
			"var(--color-gray-low);",
			"var(--color-gray-strong);"
		],
		{
			"header": [
				{
					"icon": "cash-stack",
					"title": "برداشت"
				},
				{
					"element": "<button class='btn' id='dialogbtn_hide'><i class='bi bi-x'></i></button>"
				}
			],
			"content": {
				"html": `لطفا شماره‌کارت خود را وارد کنید<br>
<input class="dialog-field" type="number" id="cardnumber" placeholder="شماره کارت ۱۶ رقمی"/><br>
درخواست شما پس از وارد کردن شماره کارت و سپس لمس دکمه «تأیید» بررسی می‌شود.
درصورتی که موجودی کیف‌پول شما کمتر از ۱۰۰ هزارتومان نباشد مقدار موجودی منهای ۱۰ درصد کارمزد، به حساب بانکی شما با شماره کارتی که در بالا وارد کرده‌اید، پس از حداقل ۳ روز کاری واریز خواهد شد.<br>
<b>تذکر:</b> در وارد کردن شماره کارت دقت کنید در غیر این صورت مسئولیت هرگونه خطای احتمالی بر عهده ما نخواهد بود.`

			},
			"footer": [
				[],
				[
					{
						"type": "danger",
						"id": "cancel",
						"text": "لغو",
						"event": `document.getElementById("dialogbtn_hide").click();`
					},
					{
						"type": "success",
						"id": "done",
						"text": "ارسال",
						"event": `cash(document.getElementById("cardnumber").value);document.getElementById("dialogbtn_hide").click();`
					}
				]
			]
		}
	);
}

function pay(value, to) {
	// todo: send XHR for deducting the desired money along with the fee from this user and adding money to the desired instructor
}
function cash(cardnumber) {
	// todo: send XHR for reduce the amount of wallet and put money transfer on the agenda
}

// show signed up courses
var showMyCourses = () => {
	// todo: load my courses from XHR then replace that instance of <dialog.contents.content.html>
	dialog(
		[
			"var(--color-white);",
			"var(--color-violet-strong);",
			"var(--color-violet-low);",
			"var(--color-gray-strong);"
		],
		{
			"header": [
				{
					"icon": "collection-play",
					"title": "دوره های من"
				},
				{
					"element": "<button class='btn' id='dialogbtn_hide'><i class='bi bi-x'></i></button>"
				}
			],
			"content": {
				"html": `
<div class="my-courses">
	<div class="my-course d-flex">
		<div class="my-course-rightside d-flex">
			<img class="my-course-thumbnail" src="dist/assets/banner.jpg" alt="thumbnail"/>
			<div class="my-course-texts">
				<p class="my-course-title">عنوان</p>
				<p class="bi bi-person my-course-author"> بهمن احمدی</p>
			</div>
		</div>
		<div class="my-course-leftside d-flex">
			<button class="bi bi-download btn btn-download-mycourse" onclick="goto(Links.downloadAll + '<COURSE-ID>');"></button>
			<button class="bi bi-caret-left btn btn-goto-mycourse" onclick="goto(Links.course+'<COURSE-ID>');"></button>
		</div>
	</div>
	<div class="my-course d-flex">
		<div class="my-course-rightside d-flex">
			<img class="my-course-thumbnail" src="dist/assets/banner.jpg" alt="thumbnail"/>
			<div class="my-course-texts">
				<p class="my-course-title">عنوان</p>
				<p class="bi bi-person my-course-author"> بهمن احمدی</p>
			</div>
		</div>
		<div class="my-course-leftside d-flex">
			<button class="bi bi-download btn btn-download-mycourse" onclick="goto(Links.downloadAll + '<COURSE-ID>');"></button>
			<button class="bi bi-caret-left btn btn-goto-mycourse" onclick="goto(Links.course+'<COURSE-ID>');"></button>
		</div>
	</div>
	<div class="my-course d-flex">
		<div class="my-course-rightside d-flex">
			<img class="my-course-thumbnail" src="dist/assets/banner.jpg" alt="thumbnail"/>
			<div class="my-course-texts">
				<p class="my-course-title">عنوان</p>
				<p class="bi bi-person my-course-author"> بهمن احمدی</p>
			</div>
		</div>
		<div class="my-course-leftside d-flex">
			<button class="bi bi-download btn btn-download-mycourse" onclick="goto(Links.downloadAll + '<COURSE-ID>');"></button>
			<button class="bi bi-caret-left btn btn-goto-mycourse" onclick="goto(Links.course+'<COURSE-ID>');"></button>
		</div>
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
						"text": "حله",
						"event": `document.getElementById("dialogbtn_hide").click();`
					}
				]
			]
		}
	);
};

// Promotion to master
var admin = () => {
	dialog(
		[
			"var(--color-white);",
			"var(--color-bluegray);",
			"var(--color-gray-low);",
			"var(--color-gray-strong);"
		],
		{
			"header": [
				{
					"icon": "camera-video",
					"title": "برگزاری دوره"
				},
				{
					"element": "<button class='btn' id='dialogbtn_hide'><i class='bi bi-x'></i></button>"
				}
			],
			"content": {
				"text": `
اگر میخواهید در مبی‌لرن دوره خود را برگزار کرده و کسب درآمد کنید،
کافی است روی دکمه «ارسال» کلیک کنید تا ایمیل شما برای ما ارسال شود.
ما در اسرع وقت به شما ایمیل خواهیم زد و از شما اطلاعات هویتی و رزومه‌تان را
دریافت می‌کنیم سپس در صورت تأیید، ضوابط و شرایط را برایتان ارسال می‌کنیم؛
در صورتی که آنها را بپذیرید سطح شما به مدرس ارتقا خواهد یافت و قادر خواهید بود تا دوره های خود را برگزار کرده، مخاطب جذب کنید و کسب درآمد کنید.
				`
			},
			"footer": [
				[],
				[
					{
						"type": "danger",
						"id": "cancel",
						"text": "لغو",
						"event": `document.getElementById("dialogbtn_hide").click();`
					},
					{
						"type": "success",
						"id": "done",
						"text": "ارسال",
						"event": `requestAdmin(user_guid);document.getElementById("dialogbtn_hide").click();`
					}
				]
			]
		}
	);
};
function requestAdmin(user_guid) {
	// todo: send XHR for be an admin
}

// logout (different by delete account)
var logout = () => {
	localStorage.removeItem("mluser");
};

// delete from cart
var deleteCart = (id) => {
	console.log(id);
	document.getElementById(`course_${id}`).remove();
	// todo : send XHR for delete course from cart
};

// buy a course from cart
var buy = (id) => {
	// todo: send XHR for buy this course
	// todo: check if There was enough money in the wallet pay from the wallet, else Inventory increase
};

// support
var support = () => {
	// todo: set from righchat api
};