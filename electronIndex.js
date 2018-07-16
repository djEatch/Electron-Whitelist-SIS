const electron = require("electron");
const { ipcRenderer } = electron;
const bootstrap = require("bootstrap"); //required even though not called!!
var $ = require("jquery");

let jmxUsers = [];
let currentJMXuser;

let sortOptions = { currentField: null, currentDir: -1 };

const modalDiv = document.querySelector("#modalDiv");

const fudgeButton = document.querySelector("#fudgeButton");
fudgeButton.addEventListener("click", fudgeFunction);

function fudgeFunction() {
  console.log("Clicked");
  //whatDoesLBThinkOfThisServer(serverList[6]);
  //makeModal();
  //$('#collapseThree').collapse('hide')
  //ipcRenderer.send('popup', {hostname:"blah", endpoint:"hghg", port:"121222", response:"hfksjdhf kdjhaksjh akahsdkjashdak dsf"});
  //ipcRenderer.send('showServerWindow',serverList);
  getSearchResults();
  // thing = document.querySelector("#modalJMXpara")
  // thing.innerHTML="TEXT FROM FUDGE"
  // $("#jmxLoginModalDiv").modal("show");
}

function resetSort() {
  sortOptions = { currentField: null, currentDir: -1 };
  //sortData("name", "hostname");
}

function sortData(field, field2) {
  if (sortOptions.currentField == field) {
    sortOptions.currentDir *= -1;
  } else {
    sortOptions.currentField = field;
    sortOptions.currentDir = 1;
  }

  serverList.sort(function(a, b) {
    var x = a[field] == null || !a[field] ? "zzz" : a[field].toLowerCase();
    var y = b[field] == null || !b[field] ? "zzz" : b[field].toLowerCase();

    if (x < y) {
      return -1 * sortOptions.currentDir;
    }
    if (x > y) {
      return 1 * sortOptions.currentDir;
    }

    if (x == y && field2) {
      var x2 =
        a[field2] == null || !a[field2] ? "zzz" : a[field2].toLowerCase();
      var y2 =
        b[field2] == null || !b[field2] ? "zzz" : b[field2].toLowerCase();
      if (x2 < y2) {
        return -1 * sortOptions.currentDir;
      }
      if (x2 > y2) {
        return 1 * sortOptions.currentDir;
      }
    }
    return 0;
  });
  drawMultiTables();
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

// ipcRenderer.on("updateMasterLBList", function(e, _masterLBList) {
//   masterLBList = _masterLBList;
//   setupEnvTypeList();
// });

function jmxLogin(e, u, p) {
  let envName = e.getAttribute("data-jmxUserEnvName");
  let _action = e.getAttribute("data-jmxUserAction");
  let _server = JSON.parse(e.getAttribute("data-jmxUserServer"));
  jmxUsers.push(new JMXUser(envName, u.value, p.value));
  $("#jmxLoginModalDiv").modal("hide");
  maintMode(_action, _server);
}

function reAuthenticateJMX(url, response, _envName, _action, _server) {
  //_envName = document.querySelector("#EnvDropDown").value;
  console.log("NEED NEW CREDS, for " + _envName, url, response);
  jmxUsers = jmxUsers.filter(function(jmxu) {
    return jmxu != currentJMXuser;
  });

  showJMXLoginModal(_envName, _action, _server);
}

function showJMXLoginModal(_envName, _action, _server) {
  try {
    $("#myModal").modal("hide");
  } catch (error) {
    console.log(error, "no modal to close");
  }
  let jmxCredModal = document.querySelector("#modalJMXpara");
  jmxCredModal.innerHTML =
    "Enter JMX login details for the envrionment: " + _envName;
  let jmxCredModalSubmitBtn = document.querySelector("#btnSetJMXcredentials");
  jmxCredModalSubmitBtn.setAttribute("data-jmxUserEnvName", _envName);
  jmxCredModalSubmitBtn.setAttribute("data-jmxUserAction", _action);
  jmxCredModalSubmitBtn.setAttribute(
    "data-jmxUserServer",
    JSON.stringify(_server)
  );
  $("#jmxLoginModalDiv").modal("show");
}

function humanEnvName(envText) {
  switch (envText.toLowerCase()) {
    case "f00":
      return "FT1";
    case "f10":
      return "FT2";
    case "f20":
      return "FT3";
    case "f30":
      return "FT4";
    case "f40":
      return "FT5";
    case "i00":
      return "IT1";
    case "i10":
      return "IT2";
    case "i20":
      return "IT3";
    case "i30":
      return "IT4";
    case "i40":
      return "IT5";
    default:
      return envText;
  }
}

function gotSubServerList(data, _subLB) {
  replyCount++;
  try {
    let subLBResponse = JSON.parse(data);
    let subLBServerList;
    if (subLBResponse.lbvserver[0].servicegroupmember) {
      subLBServerList = subLBResponse.lbvserver[0].servicegroupmember;
    } else {
      console.log("No Servers On " + _subLB.name);
      return;
    }
    for (subLBServer of subLBServerList) {
      subLBServer.LBName = _subLB.name;
      subLBServer.MLBState = subLBResponse.lbvserver[0].state;
      lbServerList.push(subLBServer);
    }
    //console.log(lbServerList.length);
  } catch (err) {
    console.log("BAD Response from Sub LB");
    console.log(_subLB);
    console.log(err);
  } finally {
    if (requestCount == replyCount) {
      processServers();
    }
  }
}

function getServerDetails(server) {
  let url =
    "http://" +
    server.hostname +
    ":" +
    server.port +
    server.endpoint +
    "?include_version=true";
  getRequest(updateServerResults, url, server);
}

function getSearchResults() {
  getRequest(
    gotSearchResults,
    "http://www.webapp2.int.boots.com/property/Reports/repProperty-AdvancedSearch.asp?propertyIndex=1&propertyValue=6&propertyFilterIndex=0&sagIndex=9&sagValue=A&",
    "myID"
  );
}

function gotSearchResults(resp, id) {
  //console.log(resp,id);

  let parser = new DOMParser();
  let reply = parser.parseFromString(resp, "text/html");
  let inTable = reply.getElementById("MainTable");

  let outTable = document.createElement("TABLE");
  outTable.classList = "table table-light table-hover";

  for (let inRow = 0; inRow < inTable.rows.length; inRow++) {
    //console.log(inRow, inTable.rows[inRow]);
    if (inTable.rows[inRow].cells.length > 1) {
      let outRow;
      if (inRow == 0) {
        var header = outTable.createTHead();
        header.classList = "thead-dark";
        outRow = header.insertRow();
      } else {
        outRow = outTable.insertRow();
      }
      for (let inCol = 0; inCol < inTable.rows[inRow].cells.length; inCol++) {
        //console.log(inRow, inCol, inTable.rows[inRow].cells[inCol].textContent);
        let outCell = outRow.insertCell();
        outCell.innerHTML = inTable.rows[inRow].cells[inCol].textContent;
      }
    }
  }


  let tableDiv = document.getElementById("TableDiv");
  tableDiv.appendChild(outTable);
}

function getRequest(callback, url, id, username, password) {
  var xhr = new XMLHttpRequest();
  var startTime = new Date();
  xhr.open("GET", url, true);
  xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  if (username) {
    xhr.setRequestHeader(
      "Authorization",
      "Basic " + btoa(username + ":" + password)
    );
  }

  xhr.send();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var endTime = new Date();
      callback(xhr.responseText, id, endTime - startTime);
    }
    if (xhr.readyState == 4 && xhr.status == 401) {
      if (
        callback.name == "gotSubLBList" ||
        callback.name == "gotSubServerList"
      ) {
        reAuthenticateLB(url, xhr.responseText);
        return;
      }
    }
    if (xhr.readyState == 4 && xhr.status != 200) {
      var endTime = new Date();
      callback(
        "connection error, status:" + xhr.status,
        id,
        endTime - startTime
      );
    }
  };
}

function postRequest(callback, url, args, auth, action, server, timeout) {
  var xhr = new XMLHttpRequest();
  //console.log(url, args);
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  if (auth) {
    xhr.setRequestHeader("Authorization", auth);
  }
  xhr.send(args);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      callback(xhr.responseText, action, null, server, timeout);
    }
    if (xhr.readyState == 4 && xhr.status == 401) {
      if (callback.name == "postedMaint") {
        reAuthenticateJMX(
          url,
          xhr.responseText,
          server.name.split("-")[0],
          action,
          server
        );
        return;
      }
    }
    if (xhr.readyState == 4 && xhr.status != 200) {
      callback(xhr.responseText, action, xhr.status, server);
    }
  };
}

function updateServerResults(data, _server, timing) {
  //format = {"status":{"available":true,"currentStatus":"UP_AND_RUNNING","label":"LEGX"}}
  for (server of serverList) {
    if (_server.hostname == server.hostname && _server.port == server.port) {
      server.response = data;
      server.responseTime = timing;
      try {
        server.ASMleg = JSON.parse(data).status.label.replace(/^Leg/, "");
      } catch (e) {
        //server.ASMleg = data;
        server.ASMleg = NOLEG;
      }
      try {
        server.status = JSON.parse(data).status.currentStatus;
      } catch (e) {
        server.status = null;
      }
      try {
        server.availability = JSON.parse(data).status.available.toString();
      } catch (e) {
        server.availability = null;
      }
      try {
        let deploys = JSON.parse(data).status.deployments;

        if (!Array.isArray(deploys)) {
          server.deployments = [];
          server.deployments.push(deploys);
        } else {
          server.deployments = deploys;
        }
        //console.log(server.deployments);
      } catch (e) {
        server.deployments = [];
      }
    }
  }
  drawMultiTables();
}

function postedMaint(response, action, err, _server, timeout) {
  let replyStatus;
  let replyTitle;
  if (err) {
    replyTitle = "Error: " + err;
    replyStatus =
      "Error " +
      err +
      " occured. Please try again later, if the error persists please contact support.";
  } else {
    let parser = new DOMParser();
    let reply = parser.parseFromString(response, "text/html");
  }
  //console.log(replyStatus);
  setTimeout(getServerListFromSubLBList, 10000, currentSubEnv);
  // if (timeout > 0) {
  //   setTimeout(getServerListFromSubLBList, 1000 * timeout, currentSubEnv);
  // }
}

function maintMode(action, server) {
  currentJMXuser = null;
  for (jmxUser of jmxUsers) {
    if (jmxUser.environmentName == server.name.split("-")[0]) {
      currentJMXuser = jmxUser;
      break;
    }
  }

  if (!currentJMXuser) {
    showJMXLoginModal(server.name.split("-")[0], action, server);
    return;
  }

  //, timeoutSeconds) {
  //gbrpmsuisf01.corp.internal
  let timeoutSeconds = 0;
  switch (action.toUpperCase()) {
    case "SET": {
      // if (!timeoutSeconds) {
      //   timeoutSeconds = 0;
      // }
      postRequest(
        postedMaint,
        "https://" +
          server.hostname +
          ":8443/application-status-monitor/jmx/servers/0/domains/com.ab.oneleo.status.monitor.mbean/mbeans/type=ApplicationStatusMonitor/operations/setMaintenanceMode(int,boolean)",
        "param=" + timeoutSeconds + "&param=false&executed=true",
        "Basic " +
          btoa(currentJMXuser.userName + ":" + currentJMXuser.passWord),
        action,
        server //,
        // timeoutSeconds
      );
      // https://gbrpmsuisf01.corp.internal:8443/application-status-monitor/jmx/servers/0/domains/com.ab.oneleo.status.monitor.mbean/mbeans/type=ApplicationStatusMonitor/operations/setMaintenanceMode%28int%2Cboolean%29
      //console.log(action, server);
      break;
    }
    case "UNSET": {
      postRequest(
        postedMaint,
        "https://" +
          server.hostname +
          ":8443/application-status-monitor/jmx/servers/0/domains/com.ab.oneleo.status.monitor.mbean/mbeans/type=ApplicationStatusMonitor/operations/unsetMaintenanceMode()",
        "executed=true",
        "Basic " +
          btoa(currentJMXuser.userName + ":" + currentJMXuser.passWord),
        action,
        server
      );
      // https://gbrpmsuisf01.corp.internal:8443/application-status-monitor/jmx/servers/0/domains/com.ab.oneleo.status.monitor.mbean/mbeans/type=ApplicationStatusMonitor/operations/unsetMaintenanceMode%28%29
      console.log(action, server);
      break;
    }
    default: {
      console.log(server);
    }
  }
  //console.log("end of function");
}

// function whatDoesLBThinkOfThisServer(server) {
//   console.log(serverList, envTypeList, fullSubLBList, lbServerList);
//   console.log(server);
// }

class JMXUser {
  constructor(envName, uName, pWord) {
    this.environmentName = envName;
    this.userName = uName;
    this.passWord = pWord;
  }
}
