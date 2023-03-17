var hasBookmarks = () => {
	// check for existing any bookmark then if returns false, insert 'sorry' text
	if (document.querySelectorAll('.bookmark').length == 0) {
		// todo: insert gif & 'sorry' text
		$(".bookmarks")[0].innerHTML = "دوره‌ای را برنگزیدید :(";
	}
};

hasBookmarks();

var refresh = () => {
    reloadTemp("bookmarks")
    hasBookmarks();
};

// DELETABLIZE BOOKMARKS
function unbookmark(el) {
	var courseID = el.id.split("_")[1];
	var course = document.getElementById("course_" + courseID);
	GET(`/delete?type=bookmark&auth=${user_guid}&id=${courseID}`);
	refresh();
	successToast("با موفقیت حذف شد!", (box) => {GET(`/bookmark?auth=${user_guid}&id=${courseID}`); refresh();}, "بازگردانی");
}