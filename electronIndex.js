const electron = require("electron");
const { ipcRenderer } = electron;
const bootstrap = require("bootstrap"); //required even though not called!!
var $ = require("jquery");
const sql = require("mssql");

const sqlConfig = JSON.parse(electron.remote.getGlobal("sqlConfigString"));
const remote = require('electron').remote

const {clipboard} = require('electron');
//clipboard.writeText('Example String');


let jmxUsers = [];
let currentJMXuser;
let sisResults;
let columbusList = [];
let resilientList = [];
let DSPList = [];
let CHSList = [];

let columbusCol = "Columbus";
let resilientCol = "Resilient";
let DSPCol = "DSP";
let CHSCol = "CHS";
let selectCol = "user_selected";
let sqlResults;
const columnsToShow = [
  "Property_id",
  "property_name",
  "division_id",
  "region_id",	
  "customer_area_id",
  "format",
  "trading_format",
  "store_origin",
  "property_type",
  "SAG",
  //"Latitude",
  //"Longitude",
  columbusCol,
  resilientCol,	
  DSPCol,
  CHSCol,
  selectCol
];

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
let closedListData;

let masterData;

showSQLLoginModal();
//getMasterData();

// function fudgeFunction() {
//   console.log("Clicked");
// }

function showSQLLoginModal(_envType) {
  let sqlCredModal = document.querySelector("#modalSQLpara");
  sqlCredModal.innerHTML =
    "Enter SQL password details for the " + sqlConfig.user + " account.";
  //let sqlCredModalSubmitBtn = document.querySelector("#btnSetSQLcredentials");
  //sqlCredModalSubmitBtn.setAttribute("data-lbUserEnvType", _envType);
  $("#loginModalDiv").modal("show");
}

function sqlLogin(p) {
  sqlConfig.password = p.value;
  $("#loginModalDiv").modal("hide");
  getMasterData();
}

function closeApp(){
  let win = remote.getCurrentWindow()
  win.close()
}

async function getMasterData() {
  let pool = await sql.connect(sqlConfig);
  let request = new sql.Request();
  request.multiple = true;

  await request.query(
    "SELECT * from dbo.t_division;SELECT * from dbo.t_region;SELECT * from dbo.t_area;select * from dbo.t_SAG;SELECT distinct [trading_format] FROM dbo.T_PROPERTY;SELECT distinct [property_type] FROM dbo.T_PROPERTY;",
    (err, result) => {
      if (err) {
        console.log(err);
        return;
      }
      masterData = result;

      //sql.close();

      let divisionDropDown = document.all.item("DivisionList");
      let regionDropDown = document.all.item("RegionList");
      let areaDropDown = document.all.item("CAList");
      let sagDropDown = document.all.item("SAGList");
      let formatDropDown = document.all.item("FormatList");
      let closedDropDown = document.all.item("ClosedList");

      divisionListData = masterData.recordsets[0];
      regionListData = masterData.recordsets[1];
      areaListData = masterData.recordsets[2];
      sagListData = masterData.recordsets[3];
      formatListData = masterData.recordsets[4];
      closedListData = masterData.recordsets[5];

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

      for (record of closedListData) {
        let option = document.createElement("option");
        option.value = record["property_type"];
        option.text = record["property_type"];
        closedDropDown.add(option);
      }

      // console.log(divisionListData);
      // console.log(regionListData);
      // console.log(areaListData);
      // console.log(sagListData);
      // console.log(formatListData);
    }
  );
}

// async function sqlQuery(queryString) {
//   try {
//     let pool = await sql.connect(sqlConfig);
//     let result = await sql.query`${queryString}`; //`SELECT TOP 100 * from dbo.t_division`
//     await sql.close();
//     return result.recordset;
//   } catch (err) {
//     console.log(err);
//   }
// }

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

ipcRenderer.on("setFilterLists", function(e, _columbusList, _resilientList, _DSPList, _CHSList) {
  columbusList = _columbusList;
  resilientList = _resilientList;
  DSPList = _DSPList;
  CHSList = _CHSList;
  let sqlQuery = buildSQLQueryString();
  getSQLResults(sqlQuery).then(results => {
    sqlResults = results;
    addExternalData(sqlResults);
    drawTableFromSQL();
  });
});

async function getSQLResults(sqlQuery) {
  let results;
  sql.close();
  let pool = await sql.connect(sqlConfig);
  let request = new sql.Request();

  return await request
    .query(
      "SELECT p.Property_id, p.property_name, p.division_id, p.region_id, p.customer_area_id,p.format, p.trading_format, p.store_origin, p.property_type, s.SAG  , tsa1.value_text as 'Latitude', tsa2.value_text as 'Longitude'  FROM [Property].[dbo].[T_PROPERTY] p left join [Property].[dbo].[T_SAG] s on p.sq_metres >= s.lower_limit and  p.sq_metres <= s.upper_limit " +
        "left join t_store_attribute tsa1 on tsa1.store_number = p.property_id and tsa1.attribute_id = 39" +
        "left join t_store_attribute tsa2 on tsa2.store_number = p.property_id and tsa2.attribute_id = 40" +
        sqlQuery +
        ";"
    )
    .then(result => {
      return result;
    });

  // console.log(results);

  // return results;
}

function addExternalData(resultSet) {
  console.log(resultSet);
  for (result of resultSet.recordset) {
    result[columbusCol] = "FALSE";
    result[resilientCol] = "FALSE";
    result[DSPCol] = "FALSE";
    result[CHSCol] = "FALSE";

    let storeNum = toFourDigits(result["Property_id"]);
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
    for (site of DSPList) {
      if (site == storeNum) {
        result[DSPCol] = "TRUE";
        break;
      }
    }
    for (site of CHSList) {
      if (site == storeNum) {
        result[CHSCol] = "TRUE";
        break;
      }
    }
  }
}

function drawTableFromSQL() {
  //filterButton
  console.log(sqlResults);
  let table = document.createElement("table");
  table.classList = "table table-light table-hover";

  // Create an empty <thead> element and add it to the table:
  var header = table.createTHead();
  header.classList = "thead-dark";

  // Create an empty <tr> element and add it to the first position of <thead>:
  var row = header.insertRow(0);

  // Insert a new cell (<td>) at the first position of the "new" <tr> element:
  //console.log(Object.keys(sisResults[0]));

  if (!sqlResults) {
    return;
  }
  if (sqlResults.recordset.length < 1) {
    return;
  }

  for (element of columnsToShow) {
    let cell = row.insertCell();
    if(element != selectCol){
      cell.innerHTML = "<b>" + element + "</b>";
    } else {
      cell.innerHTML =
      '<b>Select</b><input align="left" type="checkbox" name="chkSelect" onclick="toggleSelect(this.checked)">';
    }
  }


  let ChkColOnly = document.all.item("ChkColOnly");
  let ChkResOnly = document.all.item("ChkResOnly");
  let ChkDSPOnly = document.all.item("ChkDSPOnly");
  let ChkCHSOnly = document.all.item("ChkCHSOnly");

  for (result of sqlResults.recordset) {
    if (
      (result[columbusCol] == "TRUE" || !ChkColOnly.checked) &&
      (result[resilientCol] == "TRUE" || !ChkResOnly.checked) &&
      (result[DSPCol] == "TRUE" || !ChkDSPOnly.checked) &&
      (result[CHSCol] == "TRUE" || !ChkCHSOnly.checked)
    ) {
      let row = table.insertRow();
      let storenum;
      //console.log(result);
      for(col of columnsToShow) {
        if (col != selectCol) {
          var value = result[col];
          let cell = row.insertCell();
          cell.innerHTML = value;
          if (col == "Property_id") {
            storenum = value;
            cell.addEventListener("click", () => {
              console.log("clicked", value);
            });
          }
        }
      }

      let cell = row.insertCell();
      let chk = document.createElement("input");
      chk.type = "checkbox";
      chk.id = "chk_" + storenum;
      chk.name = "chkGroup";
      chk.value = storenum;
      chk.addEventListener("click", () => {
        selectStore(storenum, chk.checked);
      });
      if (result[selectCol]) {
        chk.checked = result[selectCol];
      } else {
        chk.checked = false;
      }
      cell.appendChild(chk);
      row.className = "table-info";
    }
  }

  let tableDiv = document.getElementById("TableDiv");
  tableDiv.innerHTML = "";
  tableDiv.appendChild(table);
}

function selectStore(num, ticked) {
  for (result of sqlResults.recordset) {
    if (result["Property_id"] == num) {
      result[selectCol] = ticked;
    }
  }
}

function toggleSelect(ticked) {
  console.log(ticked);
  checkboxes = document.getElementsByName("chkGroup");
  for (var checkbox of checkboxes) {
    checkbox.checked = ticked;
  }
  for (result of sqlResults.recordset) {
    result[selectCol] = ticked;
  }
}

function mapResults(mapMode) {
  //let records = [];
  //let records = sqlResults.recordset;
  let filters = {
    ChkColOnly: document.all.item("ChkColOnly").checked,
    ChkResOnly: document.all.item("ChkResOnly").checked,
    ChkDSPOnly: document.all.item("ChkDSPOnly").checked,
    ChkCHSOnly: document.all.item("ChkCHSOnly").checked
  };
  //ipcRenderer.send('spawnMap', records,mapMode,filters);
  ipcRenderer.send("spawnMap", sqlResults, mapMode, filters);
}

function exportResults(exportMode){
  let outputString = "";
  for (result of sqlResults.recordset){
    if(result[selectCol]){
    outputString += toFourDigits(result["Property_id"]) + ",";
    }
  }
  if(outputString.length > 0){
    outputString = outputString.slice(0,-1)

    switch(exportMode){
      case 'CLIP': {
        clipboard.writeText(outputString);
        break;
      }
      case 'SCREEN': {
        ipcRenderer.send("showResultsWindow", outputString)
        break;
      }
      case 'FILE':{
        let outputFilename = "storelist.csv"
        var file = new Blob([outputString], {type: "text"});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, outputFilename);
        else { // Others
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = outputFilename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
        break;
      }
      default:{
        break;
      }
    }


  }
  console.log(outputString);
}

function buildSQLQueryString() {
  //ipcRenderer.send("getFilterLists");
  let queryString = "";

  let ChkDivision = document.all.item("ChkDivision");
  let ChkRegion = document.all.item("ChkRegion");
  let ChkArea = document.all.item("ChkArea");
  let ChkFormat = document.all.item("ChkFormat");
  let ChkClosed = document.all.item("ChkClosed");
  let ChkSAG = document.all.item("ChkSAG");

  if (
    ChkDivision.checked ||
    ChkRegion.checked ||
    ChkArea.checked ||
    ChkFormat.checked ||
    ChkClosed.checked ||
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

  if (ChkClosed.checked) {
    let closedOptions = document.all.item("ClosedList").options;
    let closedValues = [];
    for (let item of closedOptions) {
      if (item.selected) {
        closedValues.push("'" + item.value + "'");
      }
    }
    if (queryString.substr(-7) != " WHERE ") {
      queryString += " AND ";
    }
    queryString += ` PROPERTY_TYPE NOT IN (${closedValues}) `;
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
            obj[DSPCol] = "FALSE";
            for (site of DSPList) {
              if (site == storeNum) {
                obj[DSPCol] = "TRUE";
                break;
              }
            }
            obj[CHSCol] = "FALSE";
            for (site of CHSList) {
              if (site == storeNum) {
                obj[CHSCol] = "TRUE";
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

ipcRenderer.on("initPageContent", function() {
  initPageContent();
});

ipcRenderer.on("refreshFromMap", function(e, _data) {
  //sqlResults.recordset = _data;
  sqlResults = _data;
  drawTableFromSQL();
});

function initPageContent() {
  //jsEnableControl(1, false, "SearchProperty");
  //jsEnableControl(1, true, "PropertyFilterList");
  jsEnableControl(5, false, "DivisionList");
  jsEnableControl(6, false, "RegionList");
  jsEnableControl(7, false, "CAList");
  jsEnableControl(8, false, "FormatList");
  jsEnableControl(9, false, "ClosedList");
  jsEnableControl(10, false, "SAGList");
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
