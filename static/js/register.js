var args = document.location.search.replace("?", "").replace(/\+/g, " ").split("&");
var tab = args[0].split("=")[0] == "tab" ? args[0].split("=")[1] : "undefined";

// set page inaccessible if user is registered
var validate = GET(`/userIsVaild?auth=${user_guid}`).data;
if (user_guid != null && validate.is_vaild) {
    goto(`dashboard?auth=${user_guid}`);
}

// set onClick event for form tabs
var setTabsOnClick = () => {
	document.querySelectorAll(".form-tab").forEach((t) => {
		t.onclick = () => {setTab(t.id)};
	});
};
setTabsOnClick();

// set onClick event for help icon
document.getElementById("help").onclick = () => {
	infoDialog(
		"راهنما",
		`۱. ایمیل باید یک جیمیل شخصی باشد یعنی با gmail.com@ تمام شود <br>
۲. رمزعبور باید بین ۸ تا ۳۲ کاراکتر باشد<br>
۳. رمزعبور باید شامل علائم خاص لاتین ($,.,@,_,&) باشد<br>
۴. رمزعبور نباید شامل فاصله باشد<br>
۵. رمزعبور باید شامل حروف لاتین (a-z),(A-Z) باشد<br>
۶. رمزعبور باید شامل اعداد لاتین باشد (0-9)<br>
۷. رمزعبور در ورودی های دوم و سوم باید یکسان باشد<br>`
	);
};

// set onClick event for form-action buttons
async function FormAction (id) {
	var repass = document.getElementById("repassword");
	var pass = document.getElementById("password");
	var email = document.getElementById("email");
	var mode = id == "signupbtn" ? "signup" : "login" ;

	// customize repass ok (repass is ok because that isn't exist in login)
	var ok = {
		"email": false,
		"pass": false,
		"repass": mode != "signup"
	};
	
	if (mode == "signup"){
		// check for that pass be equal with repass
		pass.value == repass.value ? ok.repass = true : await errorToast("رمزعبور در ورودی های دوم و سوم یکسان نیست");
	}
	
	if (ok.repass) {
		// check for that password chars be between 8 & 32
		if (8 <= pass.value.length && pass.value.length <= 32) {
			// check for that symbols be exist in password
			if (pass.value.match("@#$_&-+()/*\"':;!?£%~`|=[],.^".split()) == null) {
				// check for that numbers be exist in password
				if (pass.value.match("0123456789".split()) == null) {
					// check for that letters be exist in password
					if (pass.value.match("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split()) == null) {
						// check for that whitespaces don't be exist in password
						if (pass.value.match([" ","‌"]) == null) {
							ok.pass = true;
							// check for that email be a personal gmail
							if (email.value.indexOf("@gmail.com") != -1) {
								ok.email = true;
								if (ok.email && ok.pass && ok.repass) {
								    var response = POST("/register", {
								        "mode": mode,
								        "email": email.value,
								        "password": pass.value
								    });
								    if (response.statuscode == 200) {
										if (mode == "signup") {
										    dialog(
												[
													"var(--color-white);",
													"var(--color-primary-strong);",
													"var(--color-gray-low);",
													"var(--color-contrast);"
												],
												{
													"header": [
														{
															"icon": "pencil",
															"title": "تنظیم نام"
														},
														{
															"element": "<button class='btn' id='dialogbtn_hide' hidden><i class='bi bi-x'></i></button>"
														}
													],
													"content": {
														"html": `
															<input type="text" class="dialog-field" id="username" placeholder="نام و نام‌خانوادگی"/>
														`
													},
													"footer": [
														[],
														[
															{
																"type": "success",
																"id": "done",
																"text": "تنظیم نام",
																"event": `setName("${response.data.object.id}", document.getElementById("username").value);`
															}
														]
													]
												}
											);
										} else {
											successToast("عملیات باموفقیت انجام شد");
											await sleep(1000);
											localStorage.setItem('mluser', response.data.object.id);
											window.location.reload();
										}
									} else if (response.statuscode == 404) {
										errorToast("حساب کاربری پیدا نشد");
									} else if (response.statuscode == 403) {
										errorToast("حساب کاربری شما مسدود است");
									} else if (response.statuscode == 400) {
										errorToast("اطلاعات وارد شده مطابقت ندارد");
									} else if (response.statuscode == 302) {
									    errorToast("حساب کاربری از قبل موجود است");
									} else {
										errorToast(`این یک خطای فنی است (${response.code})<br> لطفا آن را به پشتیبانی گزارش دهید`, () =>{
											GET(`/log?type=InternalError&&section=register&&data=${response}`);
											successToast("ممنون از همکاری شما");
										}, "گزارش");
									}
								}
							} else {
								await errorToast("ایمیل باید یک Gmail شخصی باشد");
							}
						} else {
							await errorToast("رمزعبور نباید شامل فاصله باشد");
						}
					} else {
						await errorToast("رمزعبور باید شامل حروف لاتین هم باشد");
					}
				} else {
					await errorToast("رمزعبور باید دارای اعداد لاتین هم باشد");
				}
			} else {
				await errorToast("رمزعبور باید دارای علائم خاص لاتین هم باشد");
			}
		} else {
			await errorToast("رمزعبور باید بین ۸ تا ۳۲ کاراکتر داشته باشد");
		}
	}
}

// hide onlyon-login elements after loading page (because default tab is signup)
document.querySelectorAll('.onlyon-login').forEach((el) => {
	el.style.visibility = "hidden";
});

var setName = async (id, name) => {
	document.getElementById("dialogbtn_hide").click();
	GET(`/editUser?auth=${id}&key=name&value=${name}`);
	successToast("عملیات باموفقیت انجام شد");
	await sleep(1000);
	localStorage.setItem(`mluser`, id);
    window.location.reload();
};

// setTab function for change tabs by click
var lastRepass = "";
var setTab = async (tabName) => {
	var repass = document.getElementById("repassword");
	var signupTab = document.getElementById("signup");
	var loginTab = document.getElementById("login");
	var email = document.getElementById("email");
	var form = document.getElementById("form");
	var pass = document.getElementById("password");
	//var submitBtn = document.getElementById("submit");
	var repassbox = document.getElementById("repassbox");

	if (repassbox != null) {
		lastRepass = repassbox.outerHTML;
	}

	if (tabName == "signup") {
		signupTab.className = "form-tab tab-selected";
		login.className = "form-tab";
	} else {
		signupTab.className = "form-tab";
		login.className = "form-tab tab-selected";
	}
	setTabsOnClick();
	document.querySelectorAll('.only-on').forEach((el) => {
		if (el.classList[el.classList.length-1].split("-")[1] == tabName) {
			el.style.visibility = "visible";
		} else {
			el.style.visibility = "hidden";
		}
	});
};

// setting tab by url args
if (tab == "login") {
	setTab("login") ;
}

// showPass function for change password type inputs
var showPass = (el, field) => {
	field = document.getElementById(field);
	el.className == "bi bi-eye eye-ic" ? el.className = "bi bi-eye-slash eye-ic" : el.className = "bi bi-eye eye-ic";
	field.type == "password" ? field.type = "text" : field.type = "password";
};