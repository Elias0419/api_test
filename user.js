// ==UserScript==
// @name         refactoring test
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://app.prolific.co/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// @require      https://code.jquery.com/jquery-3.6.3.js
// @resource     https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css
// @require      https://code.jquery.com/ui/1.13.2/jquery-ui.js
// @require      https://unpkg.com/dexie/dist/dexie.js
// @require      https://unpkg.com/ag-grid-community@29.0.0/dist/ag-grid-community.min.js
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-grid.css
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-theme-apline.css
// @icon         https://www.google.com/s2/favicons?sz=64&domain=prolific.co
// @grant        none
// @unwrap
// ==/UserScript==
let running = false;
let start = false;

document.arrive(".help-centre", {
		onceOnly: true
	},

	function() {

		let t = document.querySelector('.right');
		if (t) {

			warningDialog()
			let e = t.parentNode;
			let o = document.createElement("button");
			o.style.padding = "12px 20px";
			o.style.boxShadow = "2px 2px 4px #888888";
			o.style.borderRadius = "25px";
			o.style.color = "#207bbc";
			o.id = "startButton";
			o.innerHTML = "<strong>DATABASE<br></strong>";
			e.insertAdjacentElement("afterend", o);
}
	})



function localStoreGet() {
	running = true;
	return new Promise((resolve, reject) => {
		let userID = localStorage.getItem("userID");
		if (userID) {
			getMaxPages(userID);
			resolve(userID);

		} else {
			getUserID().then(id => {
				resolve(id);
			}).catch(error => {
				reject(error);
			});
		}
	});
}

async function getUserID() {

	const accountIframe = await accountFrame();
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			let userID = accountIframe.contentDocument.querySelector(".prolific-id").innerText;
			localStorage.setItem("userID", userID);
			getMaxPages(userID);
			resolve(userID)
			$("#accountFrame").remove();

		}, 10000);
	})
}

function accountFrame() {


	let accountIframe = document.createElement("iframe");
	accountIframe.src = "https://app.prolific.co/account/General";
	accountIframe.style.display = "none";
	accountIframe.id = "accountFrame";
	let summaryDiv = document.querySelector(".help-centre");
	summaryDiv.appendChild(accountIframe);
	console.log("accountFrame2");
	return accountIframe;
}

//********************//
async function initDB(db) {
	return new Promise((resolve) => {

		var db = new Dexie("submissions");
		console.log("init db")
		db.version(1).stores({
			entries: `

id++,
reward,
status,
study,
study_code,
researcher,
completed_at,
started_at,
bonus_payments,
bonus_currency,
adjustment_payments,
adjustment_currency,
institution

                `
		});
		resolve(db);
	})
}

//***********************//
async function getMaxPages(userID) {

	const maxPagesIframe = await maxPagesFrame();
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			let topPage = maxPagesIframe.contentDocument.querySelectorAll("a.page-link");

			let maxPages1 = topPage[12].innerText;
			const maxPages = maxPages1 / 5;
			const maxPagesRounded = Math.ceil(maxPages1 / 5);
			let timeEstimate = Math.round((maxPages * 15) / 60);
			$("#dialogStart").button("enable");
			console.log(" ")
			console.log(" ")
			console.log(" ")
			console.log("Press start to begin");
			console.log("------------------------------------------")
			console.log("and it will take about " + timeEstimate + " minutes.")

			console.log(maxPages1 + " pages will be fetched with " + maxPagesRounded + " requests")
			console.log("------------------------------------------")

			console.log("submission history in batches of 100.")
			console.log("This program fetches your")
			console.log("------------------------------------------")
			localStorage.setItem("maxPages", maxPages1);

			tokenLogic(maxPages1, userID);
			resolve(maxPages1);
			$("#maxPagesFrame").remove();

		}, 10000);
	});
}

function maxPagesFrame() {


	let maxPagesIFrame = document.createElement("iframe");
	maxPagesIFrame.src = "https://app.prolific.co/submissions";
	maxPagesIFrame.style.display = "none";
	maxPagesIFrame.id = "maxPagesFrame";
	let summaryDiv = document.querySelector(".help-centre");
	summaryDiv.appendChild(maxPagesIFrame);

	return maxPagesIFrame;
}

//*********************//

async function tokenLogic(maxPages1, userID) {


	const iframe = await tokenFrame();
	return new Promise((resolve, reject) => {


		var authRequest = null;

		var open = iframe.contentWindow.XMLHttpRequest.prototype.open;
		iframe.contentWindow.XMLHttpRequest.prototype.open = function() {
			this.onreadystatechange = () => {
				authRequest = this;
			};

			return open.apply(this, [].slice.call(arguments));
		};

		var headers = iframe.contentWindow.XMLHttpRequest.prototype.setRequestHeader;
		iframe.contentWindow.XMLHttpRequest.prototype.setRequestHeader = function() {
			if (arguments[0] == 'Authorization') {
				let token = arguments[1].substring(7);

				localStorage.setItem("token", token);

				resolve(token);
				$("frame").remove();
				getPages(token)

			}
		};
	});
}

function tokenFrame() {


	let iframe = document.createElement("iframe");
	iframe.src = "https://app.prolific.co/submissions/1";
	iframe.style.display = "none";
	iframe.id = "frame";
	let summaryDiv = document.querySelector(".help-centre");
	summaryDiv.appendChild(iframe);


	return iframe;

}



/********************/

var currentPage = 0
let startTime = new Date();
async function getPages() {
	startTime = new Date();
	currentPage++
	const userID = localStorage.getItem("userID");
	const maxPages1 = localStorage.getItem("maxPages");
	var maxPages = maxPages1 / 5;
	const token = localStorage.getItem("token");
	if (currentPage === 1) {
		console.log("Fetching page " + currentPage);
	}
	if (!running) {
		return
	}
	if (currentPage <= maxPages) {
		const response = fetch(
				"https://internal-api.prolific.co/api/v1/submissions/?participant=" +
				userID +
				"&page=" +
				currentPage +
				"&page_size=100", {
					method: "GET",
					headers: {
						Authorization: "Bearer " + token,
						Accept: "application/json, text/plain,  */*",
						"Accept-Encoding": "gzip, deflate, br",
						"Accept-Language": "en-US,en;q=0.9",
						Referer: "https://app.prolific.co/",
						Origin: "https://app.prolific.co"
					}
				}
			)
			.then((response) => response.json())
			.then((data) => {
				processSubmissions(data);
			})
			.catch(function(error) {
				console.error('oshit ', error);
			})
	} else {
		let endTime = new Date();
		let timeDiff = endTime - startTime;
		let seconds = Math.round(timeDiff / 1000);
		let minutes = Math.floor(seconds / 60);
		seconds = seconds % 60;
		var progressText = document.querySelector('.progress-bar p');
		progressText.textContent = "Completed in " + minutes + ":" + seconds;
		console.log("------------------------------------------")
		console.log("Complete. " + minutes + ":" + seconds)
		console.log("------------------------------------------")
		return
	}
	pageDelay()
}



function pageDelay() {
	const maxPages1 = localStorage.getItem("maxPages");
	var maxPages = maxPages1 / 5;
	setTimeout(() => {
		if (running) {
			//currentPage++
			getPages()
			updateProgressBar(currentPage, maxPages)
			console.log("Fetching page " + currentPage);
		}
	}, "15000")
}



/********************/

const css = `
.wrapper {
				width: auto;
			}

			.progress-bar {
				width: 100%;
				background-color: #e0e0e0;
				padding: 3px;
				border-radius: 3px;
				box-shadow: inset 0 1px 3px rgba(0, 0, 0, .2);
			}

			.progress-bar-fill {
				display: block;
				height: 22px;
				background-color: #659cef;
				border-radius: 3px;
                overflow: hidden;
				transition: width 500ms ease-in-out;

			}`
const style = document.createElement("style");
style.innerHTML = css;
document.head.appendChild(style);


let currentPercentage = 0;
var barContainer = `
<div class="wrapper">
			<div class="progress-bar">
				<span class="progress-bar-fill" style="width: ${currentPercentage}%"></span>
                <p>Press Start to Begin</p>
                <p></p>
			</div>
		</div>`;

let updateProgressBarTimeout;
var updateProgressBar = (currentPage, maxPages) => {
	if (!running) {
		clearTimeout(updateProgressBarTimeout);
		return;
	}
	var targetPercentage = Math.floor((currentPage / maxPages) * 100);
	if (currentPercentage < targetPercentage) {
		currentPercentage++;
		barContainer = `
<div class="wrapper">
			<div class="progress-bar">
				<span class="progress-bar-fill" style="width: ${currentPercentage}%"></span>
                <p>Working...</p>
                <p></p>
			</div>
		</div>`;
		document.getElementById("dialog").innerHTML = barContainer;
		updateProgressBarTimeout = setTimeout(() => updateProgressBar(currentPage, maxPages), 4000);
	}
};



/**************/
document.arrive(".help-centre", {
		onceOnly: true
	},

	function() {
		let dialogLogDiv = document.createElement("div");
		dialogLogDiv.id = "dialogLog";
		document.body.appendChild(dialogLogDiv);
		let dialogDiv = document.createElement("div");
		dialogDiv.id = "dialog";
		document.body.appendChild(dialogDiv);
		$("head").append(
			'<link ' +
			'href="https://code.jquery.com/ui/1.13.2/themes/overcast/jquery-ui.css" ' +
			'rel="stylesheet" type="text/css">'
		);



		var opt = {
			width: 700,
			minWidth: 700,
			minHeight: 250,
			maxHeight: 250,
			modal: false,
			autoOpen: false,
			overflowY: scroll,
			title: " ",
			zIndex: 1,
			dialogClass: "no-titlebar",



			position: {
				my: "left top",
				at: "left bottom",
				of: "#startButton"
			},

			buttons: [{
					text: "Show Log",
					id: "dialogLogButton",
					click: function() {
						$("#dialogLog").dialog("open");
					}
				},

				/*   {
				       text: "Initialize",
				       id: "dialogInit",
				       click: function() {
				           localStoreGet()
				           $("#dialogInit").button("disable");
				       }
				   },*/

				{
					text: "Database",
					id: "dialogDB",
					click: function() {
						window.open("https://app.prolific.co/st", "_blank")
					}
				},
				{
					text: "Start",
					id: "dialogStart",
					//disabled: true,
					click: function() {


						$("#dialogStop").button("enable");
						$("#dialogStart").button("disable");
						var progressText = document.querySelector('.progress-bar p');
						progressText.textContent = "Initializing...";
						// barFirstRun()
						running = true;
						localStoreGet() //.then(getPages);


					}
				},
				{
					text: "Stop",
					id: "dialogStop",
					disabled: true,
					click: function() {
						var progressText = document.querySelector('.progress-bar p');
						progressText.textContent = "Stopped";
						console.log("Stopped");
						$("#dialogStart").button("enable");
						$("#dialogStop").button("disable");
						running = false;
					}
				},
				{
					text: "Close",
					id: "dialogClose",
					click: function() {
						console.log = console.old;
						$(this).dialog("close");
					}
				}
			]
		};

		var optL = {
			width: 700,
			minWidth: 700,
			minHeight: 400,
			maxHeight: 400,
			modal: false,
			autoOpen: false,
			overflowY: scroll,
			title: "Console Log ",
			zIndex: 1,



			position: {
				my: "right bottom",
				at: "right bottom",
				of: window
			},

			buttons: [{


				text: "Close",
				id: "dialogLogClose",
				click: function() {
					//console.log = console.old;
					$(this).dialog("close");
				}
			}]
		};


		$(function() {
			$("#dialog").dialog(opt);

			$("#dialog").html(barContainer);
			$("#startButton").click(function() {
				$("#dialog").dialog("open");
			})
		})

    $(function() {
			$("#dialogLog").dialog(optL);
			$("#dialogLog").html(logger);
		})

		let logger = document.createElement("pre");
		logger.id = "logger";
		$("#dialogLog").html(logger);

		(function(logger) {
			console.old = console.log;
			console.log = function() {
				let output = "",
					arg, i;
				for (i = 0; i < arguments.length; i++) {
					arg = arguments[i];
					output += "<span class='log-" + (typeof arg) + "'>";
					if (
						typeof arg === "object" &&
						typeof JSON === "object" &&
						typeof JSON.stringify === "function"
					) {
						output += JSON.stringify(arg);
					} else {
						output += arg;
					}
					output += "</span>&nbsp;";
				}
				logger.innerHTML = "<br>" + output + logger.innerHTML;
				// $("#logger").scrollTop($("#logger")[0].scrollHeight);
				console.old.apply(undefined, arguments);
			};
		})(logger);
		console.log("Loading...")

	})

/******************/
async function processSubmissions(data, db) {
	db = await initDB(db)

	console.log(db + " at procsubs")
	const submissions = data.results.map(submission => ({
		id: submission.id,
		status: submission.status,
		study: submission.study.name,
		study_code: submission.study_code,
		reward: submission.study.reward,
		researcher: submission.study.researcher.name,
		adjustment_payments: submission.adjustment_total.amount,
		adjustment_currency: submission.adjustment_total.currency,
		bonus_payments: submission.bonus_total.amount,
		bonus_currency: submission.bonus_total.currency,
		completed_at: submission.completed_at,
		started_at: submission.started_at,
		institution: submission.study.researcher.institution.name
	}));

	populateDatabase(submissions, db);
}



function populateDatabase(submissions, db) {
	console.log(db + " at popdb")
	submissions.forEach(submission => {
		let defaultSubmission = {
			id: submission.id || "-",
			reward: submission.reward || 0,
			status: submission.status || "none",
			study: submission.study || "none",
			researcher: submission.institution || submission.researcher || "none",
			adjustment_payments: submission.adjustment_payments || 0,
			adjustment_currency: submission.adjustment_currency || "none",
			bonus_payments: submission.bonus_payments || 0,
			bonus_currency: submission.bonus_currency || "none",
			completed_at: submission.completed_at || submission.started_at,
			study_code: submission.study_code || "none",

		};

		db.entries.bulkAdd([defaultSubmission]);
	});
}


function warningDialog() {
	if (!localStorage.getItem("warningRead")) {
		$("<div>Placeholder text content</div>").dialog({
			title: "Placeholder Title",
			modal: true,
			buttons: {
				Dismiss: function() {
					$(this).dialog("close");
					localStorage.setItem("warningRead", true);
				},
				"More Info": function() {
					$("<div>Placeholder text content for more information.</div>").dialog({
						title: "Placeholder Title",
						modal: true,
						buttons: {
							Dismiss: function() {
								$(this).dialog("close");
								localStorage.setItem("warningRead", true);
							},
						}
					});
				}
			}
		});
	}
}

function unknownError() {
	alert("Woops. Unhandled error. Bailing out.")
	return;
}

function urlWatcher() {
	var targetNode = document.body;
	var config = {
		attributes: true,
		childList: true,
		subtree: true
	};
	var observer = new MutationObserver(function(mutationsList) {

		if (location.href.indexOf("app.prolific.co/submissions") !== -1) {
			document.getElementById("startButton").style.display = "block";
		} else {
			document.getElementById("startButton").style.display = "none";
		}
	});


	observer.observe(targetNode, config);

}
/*ag-grid*/

if (location.href === "https://app.prolific.co/st") {

	console.log("test")
	document.body.innerHTML = "";
	let gridDiv = document.createElement("div");
	gridDiv.setAttribute("id", "gridDiv");
	document.body.appendChild(gridDiv);
	document.title = "Submission History";


	/*init db*/
	let db = new Dexie("submissions");
	console.log("init db")
	db.version(1).stores({
		entries: `

id++,
reward,
status,
study,
study_code,
researcher,
completed_at,
bonus_payments,
bonus_currency,
adjustment_payments,
adjustment_currency,
started_at,
institution

                `
	})
	gridDiv.innerHTML = `
<div id="myGrid"  class="ag-theme-alpine">
<style>
.ag-theme-alpine {
    --ag-grid-size: 3px;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
</style>
     </div>`



	const gridOptions = {
		columnDefs: [{

				field: "study",
				width: 450
			},
			{
				field: "researcher",
				width: 250
			},


			{
				field: "status",
				width: 100
			},



			{
				headerName: "Reward",
				field: "reward",
				width: 100,
				valueGetter: function(params) {
					var amount = params.data.reward;
					return "£" + (amount / 100).toFixed(2);

				},
				comparator: function(valueA, valueB) {
					var rewardA = parseFloat(valueA.substring(1));
					var rewardB = parseFloat(valueB.substring(1));
					return rewardA - rewardB;
				}
			},


			{
				field: "bonus_payments",
				width: 100,
				valueGetter: function(params) {
					var amount = params.data.bonus_payments;
					var currency = params.data.bonus_currency;
					var symbol = currency === "GBP" ? "£" : (currency === "USD" ? "$" : "");
					return symbol + (amount / 100).toFixed(2);

				},
				comparator: function(valueA, valueB, nodeA, nodeB, isInverted) {
					if (valueA === "none" && valueB === "none") return 0;
					if (valueA === "none") return 1;
					if (valueB === "none") return -1;

					const amountA = parseFloat(valueA.replace(/[£$]/g, ''));
					const amountB = parseFloat(valueB.replace(/[£$]/g, ''));

					return amountA > amountB ? 1 : (amountA < amountB ? -1 : 0);
				},
			},

			{
				field: "adjustment_payments",
				width: 100,
				valueGetter: function(params) {
					var amount = params.data.adjustment_payments;
					var currency = params.data.adjustment_currency;
					var symbol = currency === "GBP" ? "£" : (currency === "USD" ? "$" : "");
					return symbol + (amount / 100).toFixed(2);

				},
				comparator: function(valueA, valueB, nodeA, nodeB, isInverted) {
					if (valueA === "none" && valueB === "none") return 0;
					if (valueA === "none") return 1;
					if (valueB === "none") return -1;

					const amountA = parseFloat(valueA.replace(/[£$]/g, ''));
					const amountB = parseFloat(valueB.replace(/[£$]/g, ''));

					return amountA > amountB ? 1 : (amountA < amountB ? -1 : 0);
				},
			}, {
				headerName: "Date",
				field: "completed_at",
				width: 100,
				valueGetter: function(params) {
					var completed_at = params.data.completed_at;
					var started_at = params.data.started_at;

					console.log("params.data.completed_at:", completed_at);
					console.log("params.data.started_at:", started_at);

					if (completed_at === null || completed_at === undefined) {
						completed_at = started_at;
					}

					var date = new Date(completed_at);
					if (isNaN(date.getTime())) return "-";

					console.log("date:", date);

					return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
				},
				sortType: 'date',
				comparator: function(valueA, valueB, nodeA, nodeB, isInverted) {
					var dateA = new Date(valueA);
					var dateB = new Date(valueB);
					return dateA - dateB;
				},
			},

			{

				field: "study_code",
				width: 150
			},
			{
				field: "id",

			},
		],


		defaultColDef: {
			sortable: true,
			filter: true,
			editable: true,
			resizable: true,
		},
		rowSelection: 'multiple',
		animateRows: true,
		rowData: []
	};

	window.addEventListener('load', function() {
		const gridDiv = document.querySelector('#myGrid');
		db.entries.toArray().then(data => {
			gridOptions.rowData = data;
			new agGrid.Grid(gridDiv, gridOptions);

		})
	})
}
