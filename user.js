// ==UserScript==
// @name         prorefactor2
// @namespace    http://tampermonkey.net/
// @version      0.2
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
var currentPage = 0
let updateProgressBarTimeout;
let logOpened = false;
var currentPercentage = 0;
let logger;
let startTime;
document.arrive(".help-centre", {
  onceOnly: true
}, function () {
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
    let logger = document.createElement("pre");
    logger.id = "logger";
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
  background-color: #659cef;
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
    (function (logger) {
      console.old = console.log;
      console.log = function () {
        let output = "",
          arg, i;
        for (i = 0; i < arguments.length; i++) {
          arg = arguments[i];
          output += "<span class='log-" + (typeof arg) + "'>";
          if (typeof arg === "object" && typeof JSON === "object" && typeof JSON.stringify === "function") {
            output += JSON.stringify(arg);
          }
          else {
            output += arg;
          }
          output += "</span>&nbsp;";
        }
        logger.innerHTML = "<br>" + output + logger.innerHTML;
        console.old.apply(undefined, arguments);
      };
    })(logger);
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
    let dialogDiv = document.createElement("div");
    dialogDiv.id = "dialog";
    document.body.appendChild(dialogDiv);
    $("head").append('<link ' + 'href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css" ' + 'rel="stylesheet" type="text/css">');
    $(function () {
      $("#dialog").dialog(opt);
      $("#dialog").html(barContainer);
      $("#startButton").click(function () {
        restrictRepeat()
        $("#dialog").dialog("open");
      })
    })

    function initLogger() {
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
      open: function (event, ui) {
        $(".ui-dialog-titlebar").hide()
      },
      position: {
        my: "left top",
        at: "left bottom",
        of: "#startButton"
      },
      buttons: [{
        text: "Start",
        id: "dialogStart",
        click: function () {
          $("#dialogStop").button("enable");
          $("#dialogStart").button("disable");
          $("#progress-text").text("Initializing...");
          running = true;
          localStoreGet()
        }
      }, {
        text: "Stop",
        id: "dialogStop",
        disabled: true,
        style: "margin-right:160px",
        click: function () {
          $("#progress-text").text("Stopped");
          console.log("Stopped");
          $("#dialogStart").button("enable");
          $("#dialogStop").button("disable");
          localStorage.removeItem("startTime");
          running = false;
        }
      }, {
        text: "Show Log",
        id: "dialogLogButton",
        click: function () {
          if (logOpened) {
            $("#logger-placeholder").hide();
            logOpened = false;
          }
          else {
            initLogger()
            $("#logger-placeholder").show();
            logOpened = true;
          }
        }
      }, {
        text: "Open Database",
        id: "dialogDB",
        click: function () {
          window.open("https://app.prolific.co/st", "_blank")
        }
      }, {
        text: "Close",
        id: "dialogClose",
        click: function () {
          console.log = console.old;
          $(this).dialog("close");
        }
      }]
    };
  }
})

function localStoreGet() {
  if (!running) {
    return;
  }
  return new Promise((resolve, reject) => {
    let userID = localStorage.getItem("userID");
    if (userID) {
      getMaxPages(userID);
      console.log("userId exists")
      resolve(userID);
    }
    else {
      getUserID().then(id => {
        resolve(id);
      }).catch(error => {
        console.log("error in localStoreGet: " + error);
        reject(error);
      });
    }
  });
}
async function getUserID() {
  if (!running) {
    return;
  }
  try {
    const accountIframe = await accountFrame();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let userID = accountIframe.contentDocument.querySelector(".prolific-id");
        if (!userID) {
          reject(new Error("User ID not found in the iframe"));
        }
        else {
          userID = userID.innerText;
          localStorage.setItem("userID", userID);
          getMaxPages();
          resolve(userID);
          console.log("userID function returns " + userID);
          $("#accountFrame").remove();
        }
      }, 10000);
    });
  }
  catch (error) {
    console.error(error);
    console.log("error in getUserId: " + error);
  }
}

function accountFrame() {
  if (!running) {
    return;
  }
  let accountIframe = document.createElement("iframe");
  accountIframe.src = "https://app.prolific.co/account/General";
  accountIframe.style.display = "none";
  accountIframe.id = "accountFrame";
  let summaryDiv = document.querySelector(".help-centre");
  summaryDiv.appendChild(accountIframe);
  console.log("accountFrame2");
  return accountIframe;
}
async function getMaxPages() {
  if (!running) {
    return;
  }
  try {
    const maxPagesIframe = await maxPagesFrame();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let topPage = maxPagesIframe.contentDocument.querySelectorAll("a.page-link");
        if (topPage.length < 12) {
          reject("maxPages topPage error");
        }
        let maxPages1 = topPage[12].innerText;
        const maxPages = maxPages1 / 5;
        const maxPagesRounded = Math.ceil(maxPages1 / 5);
        let timeEstimate = Math.round((maxPages * 18) / 60);
        console.log(`
--------------------------------------------------------------------------
This program fetches your submission history in batches of 100.
${maxPages1} pages will be fetched with ${maxPagesRounded} requests and it will take about ${timeEstimate} minutes.
--------------------------------------------------------------------------


        `);
        localStorage.setItem("maxPages", maxPages1);
        tokenLogic();
        resolve(maxPages1);
        console.log("maxPages function returns maxPages1 " + maxPages1 + " and maxPages " + maxPages);
        $("#maxPagesFrame").remove();
      }, 10000);
    }).catch(error => {
      console.error(error);
      console.log("maxPagesFrame error: " + error)
    });
  }
  catch (error) {
    console.error(error);
    console.log("maxPages error: " + error)
  }
}

function maxPagesFrame() {
  if (!running) {
    return;
  }
  let maxPagesIFrame = document.createElement("iframe");
  maxPagesIFrame.src = "https://app.prolific.co/submissions";
  maxPagesIFrame.style.display = "none";
  maxPagesIFrame.id = "maxPagesFrame";
  let summaryDiv = document.querySelector(".help-centre");
  summaryDiv.appendChild(maxPagesIFrame);
  return maxPagesIFrame;
}
async function tokenLogic() {
  if (!running) {
    return;
  }
  try {
    const iframe = await tokenFrame();
    return new Promise((resolve) => {
      var authRequest = null;
      var open = iframe.contentWindow.XMLHttpRequest.prototype.open;
      iframe.contentWindow.XMLHttpRequest.prototype.open = function () {
        this.onreadystatechange = () => {
          authRequest = this;
        };
        return open.apply(this, [].slice.call(arguments));
      };
      var headers = iframe.contentWindow.XMLHttpRequest.prototype.setRequestHeader;
      iframe.contentWindow.XMLHttpRequest.prototype.setRequestHeader = function () {
        if (arguments[0] == 'Authorization') {
          let token = arguments[1].substring(7);
          localStorage.setItem("token", token);
          resolve(token);
          $("frame").remove();
          console.log("tokenLogic function returns " + token);
          getPages(token);
        }
      };
    });
  }
  catch (error) {
    console.error(error);
    console.log("tokenLogic error: " + error)
  }
}

function tokenFrame() {
  if (!running) {
    return;
  }
  let iframe = document.createElement("iframe");
  iframe.src = "https://app.prolific.co/submissions/1";
  iframe.style.display = "none";
  iframe.id = "frame";
  let summaryDiv = document.querySelector(".help-centre");
  summaryDiv.appendChild(iframe);
  return iframe;
}
async function getPages() {
  if (!startTime) {
    startTime = new Date();
    localStorage.setItem("startTime", startTime);
  }
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
    console.log("Fetch " + getElapsedTime(startTime));
    const response = fetch("https://internal-api.prolific.co/api/v1/submissions/?participant=" + userID + "&page=" + currentPage + "&page_size=100", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/json, text/plain, /",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://app.prolific.co/",
        Origin: "https://app.prolific.co"
      }
    }).then((response) => response.json()).then((data) => {
      processSubmissions(data);
      updateProgressBar(currentPage, maxPages);
      if (running) {
        setTimeout(() => {
          if (!running) {
            return;
          }
          getPages();
          updateProgressBar(currentPage, maxPages);
        }, 15000);
      }
    }).catch(function (error) {
      console.error("error ", error);
    });
  }
  else {
    let startTime = new Date(localStorage.getItem("startTime"));
    let elapsedTime = getElapsedTime(startTime);
    console.log(`
  ------------------------------------------
  Complete. Elapsed time: ${elapsedTime}
  ------------------------------------------`);
    return;
  }
}

function getElapsedTime(startTime) {
  let endTime = new Date();
  let timeDiff = endTime - startTime;
  let seconds = Math.round(timeDiff / 1000);
  let minutes = Math.floor(timeDiff / 1000 / 60);
  seconds = seconds % 60;
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return minutes + ":" + seconds;
}
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
    if (currentPercentage === 100) {
      progressBarComplete();
      return;
    }
    updateProgressBarTimeout = setTimeout(() => updateProgressBar(currentPage, maxPages), 4000);
  }
};

function progressBarComplete() {
  $("#progress-text").text("Complete");
  $('.progress-bar-fill2').css("background-color", "#00FF00 !important");
  let lastScrape = new Date()
  localStorage.setItem("lastScrape", lastScrape);
  localStorage.removeItem("startTime");
  localStorage.removeItem("maxPages");
  localStorage.removeItem("token");
  $("#dialogStop").button("disable");
}

function restrictRepeat() {
  let lastScrape = localStorage.getItem("lastScrape");
  let now = new Date();
  let diff = now - new Date(lastScrape);
  let timeUntilNextRun = 24 * 60 * 60 * 1000 - diff;
  let hours = Math.floor(timeUntilNextRun / (60 * 60 * 1000));
  let minutes = Math.floor((timeUntilNextRun % (60 * 60 * 1000)) / (60 * 1000));
  if (diff <= 24 * 60 * 60 * 1000) {
    $("#dialogStop").button("disable");
    $("#dialogStart").button("disable");
    $("#progress-text").text("This script can only be run once a day. Try again in " + hours + " hours and " + minutes + " minutes.");
    $('.progress-bar2').css("background-color", "#e0e0e0 !important");
  }
}
async function initDB(db) {
  return new Promise((resolve, reject) => {
    try {
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
    }
    catch (error) {
      console.log("error in InitDB: " + error);
      reject(error);
    }
  });
}
async function processSubmissions(data, db) {
  db = await initDB(db)
  if (typeof db === 'object' && db !== null) {
    console.log("data ok at processing submissions");
  }
  else {
    console.log("data not ok at process submissions");
  }
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
  if (typeof db === 'object' && db !== null) {
    console.log("data ok at populate database");
  }
  else {
    console.log("data not ok at populate database");
  }
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
        Dismiss: function () {
          $(this).dialog("close");
          localStorage.setItem("warningRead", true);
        },
        "More Info": function () {
          $("<div>Placeholder text content for more information.</div>").dialog({
            title: "Placeholder Title",
            modal: true,
            buttons: {
              Dismiss: function () {
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
/*ag-grid*/
if (location.href === "https://app.prolific.co/st") {
  document.body.innerHTML = "";
  let gridDiv = document.createElement("div");
  gridDiv.setAttribute("id", "gridDiv");
  document.body.appendChild(gridDiv);
  document.title = "Submission History";
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
    }, {
      field: "researcher",
      width: 250
    }, {
      field: "status",
      width: 100
    }, {
      headerName: "Reward",
      field: "reward",
      width: 100,
      valueGetter: function (params) {
        var amount = params.data.reward;
        return "£" + (amount / 100).toFixed(2);
      },
      comparator: function (valueA, valueB) {
        var rewardA = parseFloat(valueA.substring(1));
        var rewardB = parseFloat(valueB.substring(1));
        return rewardA - rewardB;
      }
    }, {
      field: "bonus_payments",
      width: 100,
      valueGetter: function (params) {
        var amount = params.data.bonus_payments;
        var currency = params.data.bonus_currency;
        var symbol = currency === "GBP" ? "£" : (currency === "USD" ? "$" : "");
        return symbol + (amount / 100).toFixed(2);
      },
      comparator: function (valueA, valueB, nodeA, nodeB, isInverted) {
        if (valueA === "none" && valueB === "none") return 0;
        if (valueA === "none") return 1;
        if (valueB === "none") return -1;
        const amountA = parseFloat(valueA.replace(/[£$]/g, ''));
        const amountB = parseFloat(valueB.replace(/[£$]/g, ''));
        return amountA > amountB ? 1 : (amountA < amountB ? -1 : 0);
      },
    }, {
      field: "adjustment_payments",
      width: 100,
      valueGetter: function (params) {
        var amount = params.data.adjustment_payments;
        var currency = params.data.adjustment_currency;
        var symbol = currency === "GBP" ? "£" : (currency === "USD" ? "$" : "");
        return symbol + (amount / 100).toFixed(2);
      },
      comparator: function (valueA, valueB, nodeA, nodeB, isInverted) {
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
      valueGetter: function (params) {
        var date = new Date(params.data.completed_at);
        if (isNaN(date.getTime())) return "-";
        //  console.log("date:", date);
        return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
      },
      comparator: function (valueA, valueB, nodeA, nodeB, isInverted) {
        var dateA = new Date(valueA);
        var dateB = new Date(valueB);
        return dateA - dateB;
      },
    }, {
      field: "study_code",
      width: 150
    }, {
      field: "id",
    }, ],
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
  window.addEventListener('load', function () {
    const gridDiv = document.querySelector('#myGrid');
    db.entries.toArray().then(data => {
      gridOptions.rowData = data;
      new agGrid.Grid(gridDiv, gridOptions);
    })
  })
}
