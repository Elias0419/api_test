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
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-grid.css
// @resource     https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-theme-apline.css
// @icon         https://www.google.com/s2/favicons?sz=64&domain=prolific.co
// @grant        none
// @unwrap
// ==/UserScript==
let running = false;
let start = false;
let db;

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
            o.innerHTML = "DATABASE<br>";
            e.insertAdjacentElement("afterend", o);
            //  o.addEventListener("click", function(){



        }
    })



function localStoreGet() {
    running = true;
    return new Promise((resolve, reject) => {
        let userID = localStorage.getItem("userID");
        if (userID) {
            getMaxPages(userID);
            resolve(userID);
            // return userID;
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
    console.log("get user id function")
    const accountIframe = await accountFrame();
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let userID = accountIframe.contentDocument.querySelector(".prolific-id").innerText;
            localStorage.setItem("userID", userID);
            getMaxPages(userID);
            resolve(userID)
            //return userID
        }, 10000);
    })
}

function accountFrame() {
    console.log("accountFrame1");

    let accountIframe = document.createElement("iframe");
    accountIframe.src = "https://app.prolific.co/account/General";
    accountIframe.style.display = "none";
    accountIframe.id = "accountFrame";
    let summaryDiv = document.querySelector(".help-centre");
    summaryDiv.appendChild(accountIframe);
    console.log("accountFrame2");
    return accountIframe;
} /*TODO close iframe*/



//***********************?//
async function getMaxPages(userID) {
    console.log("get maxpages function");
    const maxPagesIframe = await maxPagesFrame();
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let topPage = maxPagesIframe.contentDocument.querySelectorAll("a.page-link");
            console.log("maxpages loop test " + topPage);
            let maxPages1 = topPage[12].innerText;
            console.log(maxPages1 + " pages to fetch.");
            console.log("Press start to begin.");
            localStorage.setItem("maxPages", maxPages1);
            tokenLogic(maxPages1, userID);
            resolve(maxPages1);
        }, 10000);
    });
}

function maxPagesFrame() {
    console.log("accountFrame1");

    let maxPagesIFrame = document.createElement("iframe");
    maxPagesIFrame.src = "https://app.prolific.co/submissions";
    maxPagesIFrame.style.display = "none";
    maxPagesIFrame.id = "maxPagesFrame";
    let summaryDiv = document.querySelector(".help-centre");
    summaryDiv.appendChild(maxPagesIFrame);
    console.log("maxpagesFrame2");
    return maxPagesIFrame;
} /*TODO close iframe*/

//*********************//

async function tokenLogic(maxPages1, userID) {
    console.log("tokenlogic1");
    const iframe = await tokenFrame();
    return new Promise((resolve, reject) => {
        console.log("tokenlogic2");

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
                console.log("tokenlogic3");
                console.log(token);
                localStorage.setItem("token", token);
                //mainLoop( maxPages1, userID, token );
                resolve(token);

            }
        };
    });
}

function tokenFrame() {
    console.log("tokenFrame1");

    let iframe = document.createElement("iframe");
    iframe.src = "https://app.prolific.co/submissions/1";
    iframe.style.display = "none";
    iframe.id = "frame";
    let summaryDiv = document.querySelector(".help-centre");
    summaryDiv.appendChild(iframe);
    console.log("tokenFrame2");

    return iframe;
    console.log("tokenFrame3");
}

/********************/

var currentPage = 1

function getPages() {
    const userID = localStorage.getItem("userID");
    const maxPages1 = localStorage.getItem("maxPages");
    const maxPages = maxPages1 / 5;
    const token = localStorage.getItem("token");
    console.log("token " + token)
    console.log("token2 " + token)
    if (!running) {
        console.log("canceled");
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
                processSubmissions(data, db);
            })
            .catch(function(error) {
                console.error('oshit ', error);
            })
    } else {
        console.log("fetch complete")
        return
    }
    pageDelay()
}

function pageDelay() {
    setTimeout(() => {
        currentPage++
        getPages()
        console.log("Delayed");
    }, "15000")
}



document.arrive(".help-centre", {
        onceOnly: true
    },

    function() {

        let dialogDiv = document.createElement("div");
        dialogDiv.id = "dialog";
        document.body.appendChild(dialogDiv);
        $("head").append(
            '<link ' +
            'href="https://code.jquery.com/ui/1.13.2/themes/overcast/jquery-ui.css" ' +
            'rel="stylesheet" type="text/css">'
        );
        $("head").append(
            '<style type="text/css">' +
            '#dialog { ' +
            'margin: 0; padding: 0; border: 0;' +
            'height:100%; max-height:100%;' +
            'color:#f00 !important;' +
            'font: normal 3em "Arial", sans-serif;' +
            'font-size: 32px;' +
            'vertical-align: baseline;' +
            'line-height: 1; }' +
            '#dialog table { ' +
            'border-collapse: collapse;' +
            'border-spacing: 0; }'
            //+'.ui-dialog-titlebar {display:none}'
            //+'.ui-dialog-titlebar { font: italic 2em "Open Sans", sans-serif; }'
            +
            '</style>'
        );


        var opt = {
            width: 500,
            minWidth: 400,
            minHeight: 400,
            maxHeight: 400,
            modal: false,
            autoOpen: false,
            overflowY: scroll,
            title: " ",
            zIndex: 1,
            position: {
                my: "left top",
                at: "left bottom",
                of: "#startButton"
            },
            buttons: [{
                    text: "Open Database",
                    click: function() {
                        window.open("https://app.prolific.co/st", "_blank")
                    }
                },
                {
                    text: "Start",
                    click: function() {
                        getPages()
                        initDB()
                        console.log("Fetching pages...")
                        console.log("Please wait...")

                    }
                },
                {
                    text: "Stop",
                    click: function() {
                        running = false;
                    }
                },
                {
                    text: "Close",
                    click: function() {
                        console.log = console.old;
                        $(this).dialog("close");
                    }
                }
            ]
        };



        $(function() {
            $("#dialog").dialog(opt);

            $("#startButton").click(function() {
                localStoreGet()
                $("#dialog").dialog("open");
                console.log("click");
                //let topPage = document.querySelectorAll('a.page-link');
                //let maxPages1 = topPage[12].innerText;
                let logger = document.createElement("pre");
                logger.id = "logger";
                $("#dialog").html(logger);
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
                        logger.innerHTML = logger.innerHTML + "<br>" + output;
                        $("#logger").scrollTop($("#logger")[0].scrollHeight);
                        console.old.apply(undefined, arguments);
                    };
                })(logger);
                console.log("Loading...")
            });
        });
    })

function initDB() {

    db = new Dexie("submissions");
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
adjustment_currency

                `
    })
    return db;
}

function processSubmissions(data, db) {
    console.log("process submissions")
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
        completed_at: submission.completed_at
    }));

    populateDatabase(submissions, db);
}



function populateDatabase(submissions, db) {
    console.log("populate database")
    submissions.forEach(submission => {
        let defaultSubmission = {
            id: submission.id || "-",
            reward: submission.reward || 0,
            status: submission.status || "none",
            study: submission.study || "none",
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


function warningDialog() {
    if (!localStorage.getItem("warningRead")) {
        Swal.fire({
            title: "Placeholder Title",
            text: "Placeholder text content",
            showCancelButton: true,
            cancelButtonText: "Dismiss",
            confirmButtonText: "More Info",
            dangerMode: true,
            backdrop: false,
            allowOutsideClick: false,
            showClass: {
                backdrop: 'swal2-noanimation',
                popup: '',
                icon: ''
            },
            hideClass: {
                popup: '',
            },
        }).then(result => {
            if (result.value) {
                Swal.fire({
                    title: "Placeholder Title",
                    text: "Placeholder text content for more information.",
                    showCancelButton: false,
                    confirmButtonText: "Dismiss",
                    backdrop: false,
                    dangerMode: true,
                    allowOutsideClick: false,
                    showClass: {
                        backdrop: 'swal2-noanimation',
                        popup: '',
                        icon: ''
                    },
                    hideClass: {
                        popup: '',
                    },
                });
            }

        }).then(() => {
            localStorage.setItem("warningRead", true);
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
    //document.innerHTML = "";
    document.body.innerHTML = "";
    let gridDiv = document.createElement("div");
    gridDiv.setAttribute("id", "gridDiv");
    document.body.appendChild(gridDiv);
    document.title = "Submission History";


    /*init db*/
    db = new Dexie("submissions");
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
        columnDefs: [{

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



            {
                headerName: "Reward",
                field: "reward",
                width: 100,
                valueFormatter: function(params) {
                    return "£" + params.value.toFixed(2);
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
                    return valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
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
                    return valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
                },
            },



            {

                headerName: "Date",
                field: "completed_at",
                width: 100,
                valueGetter: function(params) {
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
