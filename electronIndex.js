const electron = require("electron");
const { ipcRenderer } = electron;
const bootstrap = require("bootstrap"); //required even though not called!!
var $ = require("jquery");
const sql = require("mssql");

const sqlConfig = {
  user: "PropertyRO",
  password: "my%Bait2018",
  server: "ukc1centwd\\live1",
  database: "Property",
  options: {
    encrypt: false // Use this if you're on Windows Azure
  }
};

let jmxUsers = [];
let currentJMXuser;
let sisResults;
let columbusList = [];
let resilientList = [];

let columbusCol = "Columbus";
let resilientCol = "Resilient";
let sqlResults;
const columnsToShow = []

let sortOptions = { currentField: null, currentDir: -1 };

const modalDiv = document.querySelector("#modalDiv");

// const fudgeButton = document.querySelector("#fudgeButton");
// fudgeButton.addEventListener("click", fudgeFunction);

const searchButton = document.querySelector("#searchButton");
searchButton.addEventListener("click", _ => {
  ipcRenderer.send("getFilterLists");
});

let divisionListData;
let regionListData;
let areaListData;
let sagListData;
let formatListData;

let masterData;

getMasterData();
console.log(divisionListData);
console.log(regionListData);
console.log(areaListData);

// function fudgeFunction() {
//   console.log("Clicked");
//   //whatDoesLBThinkOfThisServer(serverList[6]);
//   //makeModal();
//   //$('#collapseThree').collapse('hide')
//   //ipcRenderer.send('popup', {hostname:"blah", endpoint:"hghg", port:"121222", response:"hfksjdhf kdjhaksjh akahsdkjashdak dsf"});
//   //ipcRenderer.send('showServerWindow',serverList);
//   //ipcRenderer.send("getFilterLists");
//   //getSearchResults();
//   // thing = document.querySelector("#modalJMXpara")
//   // thing.innerHTML="TEXT FROM FUDGE"
//   // $("#jmxLoginModalDiv").modal("show");
//   // sqlConnect();
// }

async function getMasterData() {
  // try {
  //   let pool = await sql.connect(sqlConfig);
  //   masterData = await sql.query`SELECT top 100  * from dbo.t_division;SELECT TOP 100 * from dbo.t_region;SELECT TOP 100 * from dbo.t_area;select top 100 * from dbo.t_SAG;SELECT distinct [trading_format] FROM dbo.T_PROPERTY;`;
  //   sql.close();
  // } catch (err) {
  //   console.log(err);
  // }
  let pool = await sql.connect(sqlConfig);
  let request = new sql.Request();
  request.multiple = true;

  await request.query(
    "SELECT top 100  * from dbo.t_division;SELECT TOP 100 * from dbo.t_region;SELECT TOP 100 * from dbo.t_area;select top 100 * from dbo.t_SAG;SELECT distinct [trading_format] FROM dbo.T_PROPERTY;",
    (err, result) => {
      // ... error checks
      console.log(result);
      console.log(err);
      masterData = result;

      //sql.close();

      let divisionDropDown = document.all.item("DivisionList");
      let regionDropDown = document.all.item("RegionList");
      let areaDropDown = document.all.item("CAList");
      let sagDropDown = document.all.item("SAGList");
      let formatDropDown = document.all.item("FormatList");

      divisionListData = masterData.recordsets[0];
      regionListData = masterData.recordsets[1];
      areaListData = masterData.recordsets[2];
      sagListData = masterData.recordsets[3];
      formatListData = masterData.recordsets[4];

      for (record of divisionListData) {
        let option = document.createElement("option");
        option.value = record["Division_number"];
        option.text = record["Division_number"] + "-" + record["Division_Name"];
        divisionDropDown.add(option);
      }

      for (record of regionListData) {
        let option = document.createElement("option");
        option.value = record["Region_number"];
        option.text = record["Region_number"] + "-" + record["Region_name"];
        regionDropDown.add(option);
      }

      for (record of areaListData) {
        let option = document.createElement("option");
        option.value = record["Area_number"];
        option.text = record["Area_number"] + "-" + record["Area_name"];
        areaDropDown.add(option);
      }

      let sagShortList = [];
      for (record of sagListData) {
        sagShortList.push(record["SAG"].substr(0, 1));
      }
      sagShortList = sagShortList.filter(onlyUnique);
      for (record of sagShortList) {
        let option = document.createElement("option");
        option.value = record;
        option.text = record;
        sagDropDown.add(option);
      }

      for (record of formatListData) {
        let option = document.createElement("option");
        option.value = record["trading_format"];
        option.text = record["trading_format"];
        formatDropDown.add(option);
      }

      console.log(divisionListData);
      console.log(regionListData);
      console.log(areaListData);
      console.log(sagListData);
      console.log(formatListData);
    }
  );
}

async function sqlQuery(queryString) {
  try {
    let pool = await sql.connect(sqlConfig);
    let result = await sql.query`${queryString}`; //`SELECT TOP 100 * from dbo.t_division`
    await sql.close();
    return result.recordset;
  } catch (err) {
    console.log(err);
  }
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

ipcRenderer.on("setFilterLists", function(e, _columbusList, _resilientList) {
  columbusList = _columbusList;
  resilientList = _resilientList;
  //getSearchResults();
  let sqlQuery = buildSQLQueryString();
  getSQLResults(sqlQuery)
    .then(results => {sqlResults = results;addExternalData(sqlResults);drawTableFromSQL()})
  //console.log(sqlResults);
  // drawTableFromArray(sqlResults);
});

async function getSQLResults(sqlQuery) {
  let results;
  sql.close();
  let pool = await sql.connect(sqlConfig);
  let request = new sql.Request();

  // results = await request.query(
  //   "SELECT TOP 10 * FROM [Property].[dbo].[T_PROPERTY] p left join [Property].[dbo].[T_SAG] s on p.sq_metres >= s.lower_limit and  p.sq_metres <= s.upper_limit ;").then((result) => {
  //       return result;
  //   });

  return await request.query(
    "SELECT p.Property_id, p.property_name, p.region_id, p.customer_area_id,p.format, p.trading_format, p.store_origin, s.SAG  , tsa1.value_text as 'Latitude', tsa2.value_text as 'Longitude'  FROM [Property].[dbo].[T_PROPERTY] p left join [Property].[dbo].[T_SAG] s on p.sq_metres >= s.lower_limit and  p.sq_metres <= s.upper_limit " +
    "left join t_store_attribute tsa1 on tsa1.store_number = p.property_id and tsa1.attribute_id = 39" +
    "left join t_store_attribute tsa2 on tsa2.store_number = p.property_id and tsa2.attribute_id = 40" +
    sqlQuery +
    ";"
    ).then((result) => {
        return result;
    });

  // console.log(results);

  // return results;
}

function addExternalData(resultSet){
  console.log(resultSet);
  for (result of resultSet.recordset){
    result[columbusCol] = "FALSE";
    result[resilientCol] = "FALSE";

    let storeNum = toFourDigits(result['Property_id']);
    for (site of columbusList) {
      if (site == storeNum) {
        result[columbusCol] = "TRUE";
        break;
      }
    }
    for (site of resilientList) {
      if (site == storeNum) {
        result[resilientCol] = "TRUE";
        break;
      }
    }
  }

}

function drawTableFromSQL() {
  //filterButton
  //console.log(sqlResults);
  let table = document.createElement("table");
  table.classList = "table table-light table-hover";

  // Create an empty <thead> element and add it to the table:
  var header = table.createTHead();
  header.classList = "thead-dark";

  // Create an empty <tr> element and add it to the first position of <thead>:
  var row = header.insertRow(0);

  // Insert a new cell (<td>) at the first position of the "new" <tr> element:
  //console.log(Object.keys(sisResults[0]));
  for (element of Object.keys(sqlResults.recordset[0])) {
    let cell = row.insertCell();
    cell.innerHTML = "<b>" + element + "</b>";
  }
  let cell = row.insertCell();
  cell.innerHTML = '<b>Select</b><input align="left" type="checkbox" name="chkSelect" onclick="toggleSelect(this.checked)">';

  let ChkColOnly = document.all.item("ChkColOnly");
  let ChkResOnly = document.all.item("ChkResOnly");

  for (result of sqlResults.recordset) {
    if ((result[columbusCol] == "TRUE" || !ChkColOnly.checked) && (result[resilientCol]=="TRUE" || !ChkResOnly.checked)) {
      let row = table.insertRow();
      let storenum;
      //console.log(result);
      Object.keys(result).map(function(objectKey, index) {
        var value = result[objectKey];
        let cell = row.insertCell();
        cell.innerHTML = value;
        if (objectKey == "Property_id") {
          storenum = value;
          cell.addEventListener("click", () => {
            console.log("clicked", value);
            //getStoreDetail(value);
            //ipcRenderer.send('popup',server);
          });
        }
      });
      let cell = row.insertCell();
      let chk = document.createElement("input");
      chk.type = "checkbox";
      chk.id = "chk_" + storenum;
      chk.name = "chkGroup"
      cell.appendChild(chk);
      row.className = "table-info";
    }
  }

  let tableDiv = document.getElementById("TableDiv");
  tableDiv.innerHTML = "";
  tableDiv.appendChild(table);
}

function toggleSelect(ticked){
  console.log(ticked);
  checkboxes = document.getElementsByName('chkGroup');
  for(var checkbox in checkboxes){
    checkbox.checked = ticked;
  }
}

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

function buildSQLQueryString() {
  //ipcRenderer.send("getFilterLists");
  let queryString = "";

  let ChkDivision = document.all.item("ChkDivision");
  let ChkRegion = document.all.item("ChkRegion");
  let ChkArea = document.all.item("ChkArea");
  let ChkFormat = document.all.item("ChkFormat");
  let ChkSAG = document.all.item("ChkSAG");

  if (
    ChkDivision.checked ||
    ChkRegion.checked ||
    ChkArea.checked ||
    ChkFormat.checked ||
    ChkSAG.checked
  ) {
    queryString += " WHERE ";
  }

  if (ChkDivision.checked) {
    let divisionValue = document.all.item("DivisionList").value; //10 //."14-London";
    if (queryString.substr(-7) != " WHERE ") {
      queryString += " AND ";
    }
    queryString += ` DIVISION_ID = '${divisionValue}' `;
  }

  if (ChkRegion.checked) {
    let regionValue = document.all.item("RegionList").value; //"10-Airports";
    if (queryString.substr(-7) != " WHERE ") {
      queryString += " AND ";
    }
    queryString += ` REGION_ID = '${regionValue}' `;
  }

  if (ChkArea.checked) {
    let areaValue = document.all.item("CAList").value; //"311-Heathrow%20Airport";
    if (queryString.substr(-7) != " WHERE ") {
      queryString += " AND ";
    }
    queryString += ` CUSTOMER_AREA_ID = '${areaValue}' `;
  }

  if (ChkFormat.checked) {
    let formatValue = document.all.item("FormatList").value;
    if (queryString.substr(-7) != " WHERE ") {
      queryString += " AND ";
    }
    queryString += ` TRADING_FORMAT = '${formatValue}' `;
  }

  if (ChkSAG.checked) {
    let sagValue = document.all.item("SAGList").value;
    if (queryString.substr(-7) != " WHERE ") {
      queryString += " AND ";
    }
    queryString += ` left(SAG,1) = '${sagValue}' `;
  }

  console.log(queryString);
  return queryString;
}

function buildQueryString() {
  //let ChkProperty = document.all.item("ChkProperty")
  //console.log(ChkProperty.checked);
  let ChkDivision = document.all.item("ChkDivision");
  let divisionValue = encodeURI(
    document.all.item("DivisionList").value.replace("&", "amp;")
  ); //."14-London";
  let divisionString = `divisionIndex=5&divisionValue=${divisionValue}`;
  let ChkRegion = document.all.item("ChkRegion");
  let regionValue = encodeURI(
    document.all.item("RegionList").value.replace("&", "amp;")
  ); //"10-Airports";
  let regionString = `regionIndex=6&regionValue=${regionValue}`;
  let ChkArea = document.all.item("ChkArea");
  let areaValue = encodeURI(
    document.all.item("CAList").value.replace("&", "amp;")
  ); //"311-Heathrow%20Airport";
  let areaString = `areaIndex=7&areaValue=${areaValue}`;
  let ChkFormat = document.all.item("ChkFormat");
  let formatValue = encodeURI(
    document.all.item("FormatList").value.replace("&", "amp;")
  ); //"AIRPORT";
  let formatString = `formatIndex=8&formatValue=${formatValue}`;
  let ChkSAG = document.all.item("ChkSAG");
  let sagValue = encodeURI(
    document.all.item("SAGList").value.replace("&", "amp;")
  ); //"A";
  let sagString = `sagIndex=9&sagValue=${sagValue}`;

  let outputString = "?";
  if (ChkDivision.checked) {
    console.log(outputString);
    outputString += divisionString + "&";
    console.log(outputString);
  }
  if (ChkRegion.checked) {
    outputString += regionString + "&";
  }
  if (ChkArea.checked) {
    outputString += areaString + "&";
  }
  if (ChkFormat.checked) {
    outputString += formatString + "&";
  }
  if (ChkSAG.checked) {
    outputString += sagString + "&";
  }

  // if(outputString.length > 1){
  //   outputString = outputString.substr(0,outputString.length - 1)
  // }

  console.log(outputString);
  return outputString;
}

function getSearchResults() {
  let baseURL =
    "http://www.webapp2.int.boots.com/property/Reports/repProperty-AdvancedSearch.asp";
  //let queryURL = "propertyIndex=1&propertyValue=6&propertyFilterIndex=0&sagIndex=9&sagValue=A"
  let queryURL = buildQueryString();
  console.log(baseURL + queryURL);
  console.log(columbusList);
  getRequest(gotSearchResults, baseURL + queryURL, "myID");
}

function gotSearchResults(resp, id) {
  //console.log(resp,id);

  let parser = new DOMParser();
  let reply = parser.parseFromString(resp, "text/html");
  let inTable = reply.getElementById("MainTable");
  if (inTable) {
    sisResults = resultsToArray(inTable);
    drawTableFromArray(sisResults);
  } else {
    let tableDiv = document.getElementById("TableDiv");
    tableDiv.innerHTML = "";
  }
  //drawTableFromTable(inTable);
}

function gotDetailResults(resp, id) {
  let parser = new DOMParser();
  let reply = parser.parseFromString(resp, "text/html");
  let inTable = reply.getElementById("MainTable");
  console.log(inTable);
  let details = detailsToArray(inTable);
  console.log(details);
}

function getStoreDetail(storeNum) {
  //let storeNum = parseInt(_storeNum,10);
  console.log(storeNum);
  let url =
    "http://www.webapp2.int.boots.com/property/Reports/repProperty-GeneralDetail.asp?PropID=" +
    storeNum;
  getRequest(gotDetailResults, url, storeNum);
}

function drawTableFromArray(resultSet) {
  let table = document.createElement("table");
  table.classList = "table table-light table-hover";

  // Create an empty <thead> element and add it to the table:
  var header = table.createTHead();
  header.classList = "thead-dark";

  // Create an empty <tr> element and add it to the first position of <thead>:
  var row = header.insertRow(0);

  // Insert a new cell (<td>) at the first position of the "new" <tr> element:
  //console.log(Object.keys(sisResults[0]));
  for (element of Object.keys(resultSet[0])) {
    let cell = row.insertCell();
    cell.innerHTML = "<b>" + element + "</b>";
  }

  for (result of resultSet) {
    if (result[columbusCol] == "TRUE") {
      let row = table.insertRow();
      //console.log(result);
      Object.keys(result).map(function(objectKey, index) {
        var value = result[objectKey];
        let cell = row.insertCell();
        cell.innerHTML = value;
        if (objectKey == "Store Number") {
          cell.addEventListener("click", () => {
            console.log("clicked", value);
            getStoreDetail(value);
            //ipcRenderer.send('popup',server);
          });
        }
      });
      row.className = "table-info";
    }
  }

  let tableDiv = document.getElementById("TableDiv");
  tableDiv.innerHTML = "";
  tableDiv.appendChild(table);
}

function drawTableFromTable(inTable) {
  let outTable = document.createElement("TABLE");
  outTable.id = "outTable";
  outTable.classList = "table table-light table-hover";

  let headerSet = false;
  for (let inRow = 0; inRow < inTable.rows.length; inRow++) {
    //console.log(inRow, inTable.rows[inRow]);
    if (inTable.rows[inRow].cells.length > 1) {
      let outRow;
      if (!headerSet) {
        var header = outTable.createTHead();
        header.classList = "thead-dark";
        outRow = header.insertRow();
        headerSet = true;
      } else {
        outRow = outTable.insertRow();
        outRow.className = "table-info";
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

function toFourDigits(_storeNum) {
  let storeNum = "0000" + _storeNum;
  storeNum = storeNum.substr(-4);
  return storeNum;
}

function detailsToArray(inTable) {
  var json = [];
  var headings = [];

  let headerSet = false;

  let subTables = inTable.rows[0].querySelectorAll("table");
  console.log(subTables);

  for (let inRow = 0; inRow < inTable.rows.length; inRow++) {
    console.log(inTable.rows[0]);
    // if (inTable.rows[inRow].cells.length > 1) {
    //   if (!headerSet) {
    //     for (let inCol = 0; inCol < inTable.rows[inRow].cells.length; inCol++) {
    //       headings.push(inTable.rows[inRow].cells[inCol].textContent);
    //     }
    //     headerSet = true;
    //   } else {
    //     let obj = {};
    //     for (let inCol = 0; inCol < inTable.rows[inRow].cells.length; inCol++) {
    //       obj[headings[inCol]] = inTable.rows[inRow].cells[inCol].textContent;
    //     }
    //     json.push(obj);
    //   }
    // }
  }
  return json;
}

function resultsToArray(inTable) {
  var json = [];
  var headings = [];

  let headerSet = false;
  for (let inRow = 0; inRow < inTable.rows.length; inRow++) {
    if (inTable.rows[inRow].cells.length > 1) {
      if (!headerSet) {
        for (let inCol = 0; inCol < inTable.rows[inRow].cells.length; inCol++) {
          headings.push(inTable.rows[inRow].cells[inCol].textContent);
        }
        headerSet = true;
      } else {
        let obj = {};
        for (let inCol = 0; inCol < inTable.rows[inRow].cells.length; inCol++) {
          obj[headings[inCol]] = inTable.rows[inRow].cells[inCol].textContent;
          if (headings[inCol] == "Store Number") {
            let storeNum = toFourDigits(obj[headings[inCol]]);
            obj[columbusCol] = "FALSE";
            for (site of columbusList) {
              if (site == storeNum) {
                obj[columbusCol] = "TRUE";
                break;
              }
            }
            obj[resilientCol] = "FALSE";
            for (site of resilientList) {
              if (site == storeNum) {
                obj[resilientCol] = "TRUE";
                break;
              }
            }
          }
        }
        json.push(obj);
      }
    }
  }
  return json;
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

class JMXUser {
  constructor(envName, uName, pWord) {
    this.environmentName = envName;
    this.userName = uName;
    this.passWord = pWord;
  }
}

ipcRenderer.on("initPageContent", function() {
  initPageContent();
});

function initPageContent() {
  //jsEnableControl(1, false, "SearchProperty");
  //jsEnableControl(1, true, "PropertyFilterList");
  jsEnableControl(5, false, "DivisionList");
  jsEnableControl(6, false, "RegionList");
  jsEnableControl(7, false, "CAList");
  jsEnableControl(8, false, "FormatList");
  jsEnableControl(9, false, "SAGList");
}

function jsEnableControl(itemNumber, visible, controlName) {
  if (itemNumber > 0) {
    if (visible) {
      document.all.item(controlName).disabled = false;
      document.all.item(controlName).focus();
      if (controlName == "SearchProperty") {
        document.all.PropertyFilterList.disabled = false;
        document.all.PropertyFilterList.focus();
      }
    } else {
      document.all.item(controlName).disabled = true;
      if (controlName == "SearchProperty") {
        document.all.PropertyFilterList.disabled = true;
      }
    }
  } else {
    document.all.item(controlName).disabled = true;
    if (controlName == "SearchProperty") {
      document.all.PropertyFilterList.disabled = true;
    }
  }
}

/*

SELECT top 10 * 
  FROM [Property].[dbo].[T_PROPERTY];

  select top 100 * from t_store_attribute where attribute_id in (37,38,39,40);

Attribute_ID	Attribute_Name	Related_object	Attribute_format
37	Grid Reference Easting	T_PROPERTY	Number
38	Grid Reference Northing	T_PROPERTY	Number
39	Grid Reference Latitude	T_PROPERTY	Text
40	Grid Reference Longitude	T_PROPERTY	Text


*/
