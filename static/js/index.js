// posts loading effect
(async function() {
	document.getElementsByClassName("posts")[0].hidden = false;
	await sleep(1500);
	document.querySelectorAll(".fakepost").forEach((el) => {
		el.remove();
	});
	document.querySelectorAll(".post").forEach((el) => {
		el.hidden = false;
		el.onclick = () => {
			goto(Links.blog.post + el.id.split("_")[1]);
		};
	});
}());

// Search feature
document.getElementById("searcher").onclick = (el) => {
	var field = document.getElementById("search");
	goto(Links.search + field.value.replace(/ /g, "+"));
};