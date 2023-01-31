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
const variableDelay = (Math.floor(Math.random() * 11) + 5) * 1000;

//let tokenFrame;
document.arrive(".help-centre", {onceOnly: true}, function (){

let t = document.getElementsByClassName("nav-link help-centre")[0];
	if (t)
	{let e = t.parentNode;
	let o = document.createElement("button");
    o.id = "startButton";
	o.innerHTML = "Start";
	e.insertBefore(o, t);
document.getElementById("startButton").addEventListener("click", function() {
    console.log("clicked start");
    tokenFrame()
.then(tokenLogic)


       // .then(getIT)
        .catch(function(error) {
            console.error(error);
        });
});

async function tokenFrame() {
console.log("tokenFrame1");
    //tokenLogic()
    //return new Promise((resolve, reject) => {
        let iframe = document.createElement("iframe");
        iframe.src = "https://app.prolific.co/submissions/1";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.id = "frame";
        let summaryDiv = document.querySelector(".summary");
        summaryDiv.appendChild(iframe);
        console.log("tokenFrame2");

        return(iframe);
console.log("tokenFrame3");
    };
}



 async function tokenLogic(iframe) {
  console.log("tokenlogic1");
 // const iframe = await tokenFrame();

  return new Promise((resolve, reject) => {
    console.log("tokenlogic2");

    const authRequestMarker = 'openid-connect/token';
    const tokenFieldName = 'authorization';
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
        resolve(token);
        getIT(token);
      }
    };
  });
}})

function getIT(token, iframe) {
  let topPage = document.querySelectorAll('a.page-link');
  let maxPages = topPage[12].innerText -1;
    console.log(maxPages)
  let currentPage;
  console.log("fetch1");
 for (currentPage = 1; currentPage <= maxPages; ) {
  let variableDelay = (Math.floor(Math.random() * 11) + 5) * 1000;
  (function (currentPage) {
    setTimeout(() => {
      const response = fetch(
        "https://internal-api.prolific.co/api/v1/submissions/?participant=59bd5ee0b7a3f000017d5c60&page=" +
        currentPage +
        "&page_size=20",
        {
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
      );
      response.then(res => res.json()).then(data => {
        console.log(data);
      })
      .catch(error => {
  console.error(error);
      console.log(error);
    if (error.message.includes("The resource requested was not found")) {
        console.log("catch error");
     // const newToken = await getToken();
     //   savedToken = newToken;
      return
    }
    throw error;
  })
    }, variableDelay * currentPage);console.log(variableDelay)
  })(currentPage);
  currentPage++;
}}
