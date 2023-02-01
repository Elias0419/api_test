// ==UserScript==
// @name         API TEST
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://app.prolific.co/submissions
// @match        https://app.prolific.co/submissions/*
// @match        https://app.prolific.co/st
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// @require      https://code.jquery.com/jquery-3.6.3.js
// @require      https://code.jquery.com/ui/1.13.1/jquery-ui.min.js
// @require      https://unpkg.com/dexie/dist/dexie.js
// @require      https://unpkg.com/ag-grid-community@29.0.0/dist/ag-grid-community.min.js
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-grid.css
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-theme-apline.css
// @icon         https://www.google.com/s2/favicons?sz=64&domain=prolific.co
// @grant        none
// ==/UserScript==
var db;
document.arrive(".help-centre",
{
	onceOnly: true
}, function ()
{

	let t = document.getElementsByClassName("nav-link help-centre")[0];
	if (t)
	{
		let e = t.parentNode;
		let o = document.createElement("button");
		o.id = "startButton";
		o.innerHTML = "Start";
		e.insertBefore(o, t);
		document.getElementById("startButton").addEventListener("click", function ()
		{
			localStoreGet().then(initDB).then(tokenFrame).then(tokenLogic).catch(function (error)
			{
				console.error(error);
			});
		});


		function localStoreGet()
		{
			return new Promise((resolve, reject) =>
			{
				let userID = localStorage.getItem("userID");
				if (userID)
				{
					resolve(userID);
                    return userID;
				}
				else
				{
					getUserID().then(id =>
					{
						resolve(id);
					}).catch(error =>
					{
						reject(error);
					});
				}
			});
		}

		async function getUserID()
		{
			console.log("get user id function")
			const accountIframe = await accountFrame();
			return new Promise((resolve, reject) =>
			{
				setTimeout(() =>
				{
					let userID = accountIframe.contentDocument.querySelector(".prolific-id").innerText;
					localStorage.setItem("userID", userID);
					resolve(userID)
					return userID
				}, 10000);
			})
		}

		function accountFrame()
		{
			console.log("accountFrame1");

			let accountIframe = document.createElement("iframe");
			accountIframe.src = "https://app.prolific.co/account/General";
			accountIframe.style.width = "1px";
			accountIframe.style.height = "1px";
			accountIframe.id = "accountFrame";
			let summaryDiv = document.querySelector(".summary");
			summaryDiv.appendChild(accountIframe);
			console.log("accountFrame2");
			return accountIframe;
		}/*TODO close iframe*/

		async function tokenFrame()
		{
			console.log("tokenFrame1");

			let iframe = document.createElement("iframe");
			iframe.src = "https://app.prolific.co/submissions/1";
			iframe.style.width = "1px";
			iframe.style.height = "1px";
			iframe.id = "frame";
			let summaryDiv = document.querySelector(".summary");
			summaryDiv.appendChild(iframe);
			console.log("tokenFrame2");

			return iframe;
			console.log("tokenFrame3");
		}



		async function tokenLogic(iframe)
		{
			console.log("tokenlogic1");

			return new Promise((resolve, reject) =>
			{
				console.log("tokenlogic2");

				var authRequest = null;

				var open = iframe.contentWindow.XMLHttpRequest.prototype.open;
				iframe.contentWindow.XMLHttpRequest.prototype.open = function ()
				{
					this.onreadystatechange = () =>
					{
						authRequest = this;
					};

					return open.apply(this, [].slice.call(arguments));
				};

				var headers = iframe.contentWindow.XMLHttpRequest.prototype.setRequestHeader;
				iframe.contentWindow.XMLHttpRequest.prototype.setRequestHeader = function ()
				{
					if (arguments[0] == 'Authorization')
					{
						let token = arguments[1].substring(7);
						console.log("tokenlogic3");
						console.log(token);
						resolve(token);
						getIT(token);
					}
				};
			});
		}
	}

	function getIT(token, iframe, userID)
	{
		let topPage = document.querySelectorAll('a.page-link');
		let maxPages1 = topPage[12].innerText;
        let maxPages = maxPages1 /5 ;
		console.log(maxPages)
        userID = localStorage.getItem("userID");
        console.log(userID)
		let currentPage;
		console.log("fetch1");
		for (currentPage = 1; currentPage <= maxPages;)
		{
			let variableDelay = (Math.floor(Math.random() * 11) + 5) * 1000;
			(function (currentPage)
			{
				setTimeout(() =>
				{
					const response = fetch(
						"https://internal-api.prolific.co/api/v1/submissions/?participant=" + userID + "&page=" +
						currentPage +
						"&page_size=100",
						{
							method: "GET",
							headers:
							{
								Authorization: "Bearer " + token,
								Accept: "application/json, text/plain,  */*",
								"Accept-Encoding": "gzip, deflate, br",
								"Accept-Language": "en-US,en;q=0.9",
								Referer: "https://app.prolific.co/",
								Origin: "https://app.prolific.co"
							}
						}
					);
					response.then(res => res.json()).then(data =>
						{//populateDatabase(data, db);
                        processSubmissions(data, db);
							console.log(data);
						})
						.catch(error =>
						{
							console.error(error);
							console.log(error);
							if (error.message.includes("The resource requested was not found"))
							{
								console.log("catch error");

								return
							}
							throw error;
						})
				}, variableDelay * currentPage);
				console.log(variableDelay)
			})(currentPage);
			currentPage++;
		}
	}
})

function initDB(){

db = new Dexie("submissions");
    console.log("init db")
db.version(1).stores(
{
	entries: `

id++,
reward,
is_complete,
status,
study,
study_code,
submission_reward,
time_taken,
study_name,
researcher,
adjustment_payments,
bonus_payments,
completed_at,
bonus_currency,
submission_currency,
adjustment_currency

                `
})}
function processSubmissions(data, db){
    console.log("process submissions")
const submissions = data.results.map(submission => ({
  id: submission.id,
  is_complete: submission.is_complete,
  status: submission.status,
  study: submission.study.name,
  study_code: submission.study_code,
  reward: submission.study.reward,
  submission_reward: submission.submission_reward.amount,
  submission_currency: submission.submission_reward.currency,
  time_taken: submission.time_taken,
  study_name: submission.study.name,
  researcher: submission.study.researcher.name,
  adjustment_payments: submission.adjustment_total.amount,
  adjustment_currency: submission.adjustment_total.currency,
  bonus_payments: submission.bonus_total.amount,
  bonus_currency: submission.bonus_total.currency,
  completed_at: submission.completed_at
}));

populateDatabase (submissions, db);
}




function populateDatabase(submissions, db){
 console.log("populate database")
 submissions.forEach(submission => {
   let defaultSubmission = {
     id: submission.id || "-",
     reward: submission.reward || 0,
     is_complete: submission.is_complete || false,
     status: submission.status || "none",
     submission_reward: submission.submission_reward || 0,
     submission_currency: submission.submission_currency || "none",
     time_taken: submission.time_taken || 0,
     study_name: submission.study_name || "none",
     researcher: submission.researcher || "none",
     adjustment_payments: submission.adjustment_total || 0,
     adjustment_currency: submission.adjustment_currency || "none",
     bonus_payments: submission.bonus_total || 0,
     bonus_currency: submission.bonus_currency || "none",
     completed_at: submission.completed_at || "none",
     study_code: submission.study_code || "none"
   };
   db.entries.bulkAdd([defaultSubmission]);
 });
}

/*ag-grid*/

if (location.href === "https://app.prolific.co/st")
{

	console.log("test")
	//document.innerHTML = "";
	document.body.innerHTML = "";
	let gridDiv = document.createElement("div");
	gridDiv.setAttribute("id", "gridDiv");
	document.body.appendChild(gridDiv);
	document.title = "Qualifications";


	/*init db*/
db = new Dexie("submissions");
    console.log("init db")
db.version(1).stores(
{
	entries: `

id++,
is_complete,
status,
study,
study_code,
submission_reward,
time_taken,
study_name,
researcher,
adjustment_payments,
bonus_payments,
completed_at,
bonus_currency,
submission_currency,
adjustment_currency

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
		columnDefs: [
			{

				field: "study_name",
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
			/*{

field: "submission_reward",
width: 100,
valueGetter: function (params) {
let reward = params.data.submission_reward;
let currency = params.data.submission_currency;
let symbol = "$";
if (currency === "GBP") {
symbol = "£";
}
reward = (reward / 100).toFixed(2);
return symbol + reward;
},
comparator: function (valueA, valueB) {
let rewardA = valueA.substr(1);
let rewardB = valueB.substr(1);
return rewardA - rewardB;
}},*/


                  {
    headerName: "Reward",
    field: "reward",
                      width: 100,
    valueFormatter: function(params) {
      return "£" + params.value.toFixed(2);
    }
  },


            { field: "bonus_payments",
             width: 100,
valueGetter: function (params)
{
var amount = params.data.bonus_payments;
var currency = params.data.bonus_currency;
var symbol = currency === "GBP" ? "£" : (currency === "USD" ? "$" : "");
return symbol + (amount / 100).toFixed(2);

},
comparator: function(valueA, valueB, nodeA, nodeB, isInverted) {
if (valueA === "none" && valueB === "none") return 0;
if (valueA === "none") return 1;
if (valueB === "none") return -1;
return valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
},},

            {  field: "adjustment_payments",
             width: 100,
valueGetter: function (params)
{
var amount = params.data.adjustment_payments;
var currency = params.data.adjustment_currency;
var symbol = currency === "GBP" ? "£" : (currency === "USD" ? "$" : "");
return symbol + (amount / 100).toFixed(2);

},
comparator: function(valueA, valueB, nodeA, nodeB, isInverted) {
if (valueA === "none" && valueB === "none") return 0;
if (valueA === "none") return 1;
if (valueB === "none") return -1;
return valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
},},



			{

headerName: "Date",
field: "completed_at",
width: 100,
valueGetter: function (params) {
var date = new Date(params.data.completed_at);
if (isNaN(date.getTime())) return "-";
return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
},
comparator: function(valueA, valueB, nodeA, nodeB, isInverted) {
if (valueA === "-" && valueB === "-") return 0;
if (valueA === "-") return 1;
if (valueB === "-") return -1;
var dateA = new Date(valueA);
var dateB = new Date(valueB);
return dateA > dateB ? 1 : (dateA < dateB ? -1 : 0);

            },

				field: "study_code",
                width: 150
			},
            {
				field: "id",

			},
		],


		defaultColDef:
		{
			sortable: true,
			filter: true,
			editable: true,
			resizable: true,
		},
		rowSelection: 'multiple',
		animateRows: true,
		rowData: []
	};

	window.addEventListener('load', function ()
	{
		const gridDiv = document.querySelector('#myGrid');
		db.entries.toArray().then(data =>
		{
			gridOptions.rowData = data;
			new agGrid.Grid(gridDiv, gridOptions);

		})
	})
}
