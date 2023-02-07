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
// @grant        GM_addStyle
// @unwrap
// ==/UserScript==
let running = false;



document.arrive(".help-centre", {
    onceOnly: true
},

                function() {

    let buttonElem = document.querySelector('.right');
    if (buttonElem) {

       // warningDialog()
           let buttonElemParent = buttonElem.parentNode;
           let buttonDiv = document.createElement("div");
            buttonDiv.style.cursor = "pointer";
           buttonDiv.classList.add("startButtonClass");
           buttonDiv.id = "startButton";
           buttonDiv.innerHTML = "DB<br>";
           buttonElemParent.insertAdjacentElement("afterend", buttonDiv);


    }
})



function localStoreGet() {
     if (!running) {
        return;}
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
 if (!running) {
        return;}
    const accountIframe = await accountFrame();
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let userID = accountIframe.contentDocument.querySelector(".prolific-id").innerText;
            localStorage.setItem("userID", userID);
            getMaxPages(userID);
            resolve(userID)
            console.log("userID function returns "+userID )
            $("#accountFrame").remove();

        }, 10000);
    })
}

function accountFrame() {
 if (!running) {
        return;}

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
 if (!running) {
        return;}
    const maxPagesIframe = await maxPagesFrame();
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let topPage = maxPagesIframe.contentDocument.querySelectorAll("a.page-link");

            let maxPages1 = topPage[12].innerText;
            const maxPages = maxPages1 / 5;
            const maxPagesRounded = Math.ceil(maxPages1 / 5);
            let timeEstimate = Math.round((maxPages * 15) / 60);
            //$("#dialogStart").button("enable");
            console.log(" ")
            console.log(" ")
            console.log(" ")
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
             console.log("maxPages function returns maxPages1 "+maxPages1+" and maxPages "+maxPages )
            $("#maxPagesFrame").remove();

        }, 10000);
    });
}

function maxPagesFrame() {

 if (!running) {
        return;}
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

 if (!running) {
        return;}
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
                 console.log("tokenLogic function returns "+token )
                getPages(token)

            }
        };
    });
}

function tokenFrame() {
 if (!running) {
        return;}

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
    currentPage++;
    const userID = localStorage.getItem("userID");
    const maxPages1 = localStorage.getItem("maxPages");
    var maxPages = maxPages1 / 5;
    const token = localStorage.getItem("token");
  
    if (!running) {
        return;
    }
    $("#progress-text").text("Working...");
    if (currentPage <= maxPages) {
        const response = fetch(
            "https://internal-api.prolific.co/api/v1/submissions/?participant=" +
            userID +
            "&page=" +
            currentPage +
            "&page_size=100",
            {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + token,
                    Accept: "application/json, text/plain, /",
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
            updateProgressBar(currentPage, maxPages);
            if (running) {
                setTimeout(() => {
                    getPages();
                    updateProgressBar(currentPage, maxPages);
                    console.log("Fetch");
                }, 15000);
            }
        })
        .catch(function (error) {
            console.error("error ", error);
        });
    } else {
        let endTime = new Date();
        let timeDiff = endTime - startTime;
        let seconds = Math.round(timeDiff / 1000);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        
        $("#progress-text").text("Completed. " + minutes + ":" + seconds);
        console.log("------------------------------------------");
        console.log("Complete. " + minutes + ":" + seconds);
        console.log("------------------------------------------");
        return;
    }
}


/********************/

const css = `
.wrapper2 {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 22px;
  flex-direction: column;
}

.progress-bar2 {
  width: 95%;
  background-color: #e0e0e0;
  border-radius: 3px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, .2);
  overflow: hidden;
}

.progress-bar-fill2 {
  height: 22px;
display: block;
  background-color: #659cef !important;
  border-radius: 3px;
  width: 0;
  overflow: hidden;
  transition: width 500ms ease-in-out;
}

.logger {
  margin-top: 20px;
}

.startButtonClass {
    padding: 6px 10px;
    color: #FFFFFF !important;
     font-weight: bold;
}
#progress-text {
  position: relative;
  top: -23px;
  left: 10px;
}
}`
const style = document.createElement("style");
style.innerHTML = css;
document.head.appendChild(style);


let currentPercentage = 0;
var barContainer = `
<div class="wrapper2">
			<div class="progress-bar2">
				<span id="pb2" class="progress-bar-fill2" style="width: ${currentPercentage}%"></span>
                <p id="progress-text">Press Start to Begin</p>
                
                <p></p>
			</div>

		</div>
<div class="logger"><p id="logger-placeholder"></p></div>
`;

let updateProgressBarTimeout;
let logOpened = false;

var updateProgressBar = (currentPage, maxPages) => {
    if (!running) {
        clearTimeout(updateProgressBarTimeout);
        return;
    }
    var targetPercentage = Math.floor((currentPage / maxPages) * 100);
    if (currentPercentage < targetPercentage) {
        currentPercentage++;
        if (currentPercentage > targetPercentage) {
            currentPercentage = targetPercentage;
        }

        $("#pb2").width(`${currentPercentage}%`);
        $("#progress-text").text("Working...");


        if (logOpened) {initLogger2()
          console.log(logOpened+" 1")
        }

        document.getElementById("dialog").innerHTML = barContainer

        updateProgressBarTimeout = setTimeout(() => updateProgressBar(currentPage, maxPages), 4000);
    }
};

function initLogger2(){
console.log("initLoggerauto")
 console.log(logOpened+" 1")
$("#logger-placeholder").html(logger.appendChild);
}

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
        'href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css" ' +
        'rel="stylesheet" type="text/css">'
    );

    $(function() {
        $("#dialog").dialog(opt);

        $("#dialog").html(barContainer);
        $("#startButton").click(function() {

            $("#dialog").dialog("open");
        })
    })

function initLogger(){
console.log("initLogger")
$("#logger-placeholder").html(logger);
}

var opt = {
  width: 700,
  minWidth: 700,
  minHeight: 150,
  maxHeight: 500,
  modal: false,
  autoOpen: false,
  overflowY: "scroll",
  title: " ",
  zIndex: 1,
  dialogClass: "no-titlebar",
    draggable: false,
		resizable: false,
  open: function(event, ui) {
    $(".ui-dialog-titlebar").hide()

  },





        position: {
            my: "left top",
            at: "left bottom",
            of: "#startButton"
        },

        buttons: [
             {
                      text: "Start",
                      id: "dialogStart",

                      click: function() {


                          $("#dialogStop").button("enable");
                          $("#dialogStart").button("disable");
                          var progressText = document.querySelector('#progress-text');
                          progressText.textContent = "Initializing...";

                          running = true;
                          localStoreGet()


                      }
                  },
                  {
                      text: "Stop",
                      id: "dialogStop",
                      disabled: true,
                      style: "margin-right:160px",
                      click: function() {
                          var progressText = document.querySelector('.progress-bar2 p');
                          progressText.textContent = "Stopped";
                          console.log("Stopped");
                          $("#dialogStart").button("enable");
                          $("#dialogStop").button("disable");
                          running = false;
                      }
                  },


            {
            text: "Show Log",
            id: "dialogLogButton",

           click: function() {
  if (logOpened) {
    $("#logger-placeholder").hide();
    logOpened = false;
  } else {
    initLogger()
      $("#logger-placeholder").show();
    logOpened = true;
  }
}
        },

                  {
                      text: "Open Database",
                      id: "dialogDB",
                      //style: "margin-right:160px",
                      click: function() {
                          window.open("https://app.prolific.co/st", "_blank")
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


});


    let logger = document.createElement("pre");
    logger.id = "logger";
  

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



/******************/
async function processSubmissions(data, db) {
    db = await initDB(db)

    console.log(db + " at processing submissions");
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
    console.log(db + " at populating database");
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
