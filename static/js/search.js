var args = document.location.search.replace("?", "").replace(/\+/g, " ").split("&");
var field = document.getElementById("field");
var btn = document.getElementById("searcher");

// search function
function search(type, query) {
    var req = {'type': type};
    req[type] = query;
    return POST('/search', req).data.results;
}

// function for getting master name
function getUserName(uuid) {
    return GET(`/getuser?id=${uuid}`).name;
}

var showSearchResult = (result) => {
    if (result.length == 0) {
        errorToast("جستجوی شما نتیجه‌ای نداشت");
        return;
    }
	var html = ``;
	for (var i of result) {
		html += `
<div class="search d-flex">
	<div class="search-rightside d-flex">
		<img class="search-thumbnail" src="${i.thumbnail}" alt="[THUMBNAIL]"/>
		<div class="search-texts">
			<p class="search-title">${i.title}</p>
			<p class="bi bi-person search-author"> ${getUserName(i.master)}</p>
		</div>
	</div>
	<div class="search-leftside">
		<button class="bi bi-caret-left btn btn-goto-search" onclick="goto(Links.course + '${i.id}');"></button>
	</div>
</div>
		`;
	}
	dialog(
		[
			"var(--color-white);",
			"var(--color-primary);",
			"var(--color-gray-low);",
			"var(--color-contrast);"
		],
		{
			"header": [
				{
					"icon": "search",
					"title": `نتایج جستجو (${persianizeNums(result.length)})`
				},
				{
					"element": "<button class='bi bi-x btn' id='dialogbtn_hide'></button>"
				}
			],
			"content": {
				"html": `<div class="searchs">${html}</div>`
			},
			"footer": [
				[],
				[
					{
						"type": "success",
						"id": "done",
						"text": "<i class='bi bi-check'></i>",
						"event": `document.getElementById("dialogbtn_hide").click();`
					}
				]
			]
		}
	);
};

// search by course name
var q = args[0].split("=")[0] == "q" ? decodeURIComponent(args[0].split("=")[1]).replace(/\+/g, " ") : "undefined";
if (q != "undefined") {
	showSearchResult(search("q", q));
}

// search by category
var c = args[0].split("=")[0] == "c" ? decodeURIComponent(args[0].split("=")[1]) : "undefined";
if (c != "undefined") {
	showSearchResult(search("c", c));
}