const electron = require("electron");
const { ipcRenderer } = electron;
const bootstrap = require("bootstrap"); //required even though not called!!
var $ = require("jquery");
const sql = require("mssql");

const sqlConfig = JSON.parse(electron.remote.getGlobal("sqlConfigString"));
const remote = require("electron").remote;

const { clipboard } = require("electron");
//clipboard.writeText('Example String');

let filterArray;
let sortArray;
let actionedArray = [];

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
  { dbText: "Property_id", columnTitle: "S.No" },
  { dbText: "property_name", columnTitle: "Name" },
  { dbText: "division_id", columnTitle: "Div" },
  { dbText: "region_id", columnTitle: "Reg" },
  { dbText: "customer_area_id", columnTitle: "Area" },
  { dbText: "format", columnTitle: "Format" },
  { dbText: "trading_format", columnTitle: "T.Format" },
  { dbText: "store_origin", columnTitle: "Origin" },
  { dbText: "property_type", columnTitle: "Type" },
  { dbText: "SAG", columnTitle: "SAG" },
  //"Latitude",
  //"Longitude",
  // columbusCol,
  // resilientCol,
  // DSPCol,
  // CHSCol,
  { dbText: selectCol, columnTitle: "Select" },
  { dbText: "actioned", columnTitle: "Actioned" }
];

let sortOptions = { currentField: null, currentDir: -1 };

const modalDiv = document.querySelector("#modalDiv");

let recCount = 0;
let selectCount = 0;
let actionCount = 0;

function search() { //called from html
  // let sqlQuery = buildSQLQueryString();
  // getSQLResults(sqlQuery).then(results => {
  //   sqlResults = results;
  //   addExternalData(sqlResults);
  //   drawTableFromSQL();
  // });
}

let divisionListData;
let regionListData;
let areaListData;
let sagListData;
let formatListData;
let closedListData;

let masterData;

showSQLLoginModal();


function showSQLLoginModal(_envType) {
  let sqlCredModal = document.querySelector("#modalSQLpara");
  sqlCredModal.innerHTML = "Enter SQL password details for the " + sqlConfig.user + " account.";
  //let sqlCredModalSubmitBtn = document.querySelector("#btnSetSQLcredentials");
  //sqlCredModalSubmitBtn.setAttribute("data-lbUserEnvType", _envType);
  $("#loginModalDiv").modal("show");
}

function sqlLogin(p) {
  sqlConfig.password = p.value;
  $("#loginModalDiv").modal("hide");
  getAllData()
}

function closeApp() {
  let win = remote.getCurrentWindow();
  win.close();
}

async function getAllData() {
  let pool = await sql.connect(sqlConfig);
  let request = new sql.Request();
  request.multiple = true;

  await request.query(
    "SELECT * from dbo.t_division;SELECT * from dbo.t_region;SELECT * from dbo.t_area;select * from dbo.t_SAG;SELECT distinct [trading_format] FROM dbo.T_PROPERTY;SELECT distinct [property_type] FROM dbo.T_PROPERTY;"
    + "SELECT p.Property_id, p.property_name, p.division_id, p.region_id, p.customer_area_id,p.format, p.trading_format, p.store_origin, p.property_type, s.SAG  , tsa1.value_text as 'Latitude', tsa2.value_text as 'Longitude'  FROM [Property].[dbo].[T_PROPERTY] p left join [Property].[dbo].[T_SAG] s on p.sq_metres >= s.lower_limit and  p.sq_metres <= s.upper_limit " +
        "left join t_store_attribute tsa1 on tsa1.store_number = p.property_id and tsa1.attribute_id = 39" +
        "left join t_store_attribute tsa2 on tsa2.store_number = p.property_id and tsa2.attribute_id = 40" +
        ";"
    ,
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
      sqlResults = masterData.recordsets[6];

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

      addExternalData(sqlResults);
      drawTableFromSQL();
    }
  );
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

  sqlResults.sort(function(a, b) {
    //var x = a[field] == null || !a[field] ? "zzz" : a[field];//.toLowerCase();
    //var y = b[field] == null || !b[field] ? "zzz" : b[field];//.toLowerCase();

    var x = a[field];
    var y = b[field];

    if (x < y) {
      return -1 * sortOptions.currentDir;
    }
    if (x > y) {
      return 1 * sortOptions.currentDir;
    }

    if (x == y && field2) {
      var x2 = a[field2] == null || !a[field2] ? "zzz" : a[field2]; //.toLowerCase();
      var y2 = b[field2] == null || !b[field2] ? "zzz" : b[field2]; //.toLowerCase();
      if (x2 < y2) {
        return -1 * sortOptions.currentDir;
      }
      if (x2 > y2) {
        return 1 * sortOptions.currentDir;
      }
    }
    return 0;
  });
  //drawMultiTables();
  drawTableFromSQL();
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function addExternalData(resultSet) {
  //console.log(resultSet);
  for (result of resultSet) {
    let storeNum = toFourDigits(result["Property_id"]);
    //result["actioned"] = false;
    for (let filter of filterArray) {
      result[filter.filterName] = "FALSE";
      for (site of filter.storeNums) {
        if (site == storeNum) {
          result[filter.filterName] = "TRUE";
          break;
        }
      }
    }
    for (let sort of sortArray) {
      result[sort.sortName] = 0;
      for (site of sort.values) {
        if (site.storeNum == storeNum) {
          result[sort.sortName] = Number(site.value);
          break;
        }
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

  if (!sqlResults) {
    return;
  }
  if (sqlResults.length < 1) {
    return;
  }

  for (element of columnsToShow) {
    if (element.dbText != selectCol && element.dbText != "actioned") {
      let cell = row.insertCell();
      cell.innerHTML = "<b>" + element.columnTitle + "</b>";
      cell.setAttribute("data-dbText", element.dbText);
      cell.addEventListener("click", function() {
        sortData(cell.getAttribute("data-dbText"), "Property_id");
      });
    }
  }

  for (let filter of filterArray) {
    let cell = row.insertCell();
    cell.innerHTML = "<b>" + filter.filterName + "</b>";
    cell.addEventListener("click", function() {
      sortData(filter.filterName, "Property_id");
    });
  }
  for (let sort of sortArray) {
    let cell = row.insertCell();
    cell.innerHTML = "<b>" + sort.sortName + "</b>";
    cell.addEventListener("click", function() {
      sortData(sort.sortName, "Property_id");
    });
  }

  let cell = row.insertCell();
  cell.innerHTML = '<b>Select</b><input align="left" type="checkbox" name="chkSelect" onclick="toggleSelect(this.checked)">';
  // let cell2 = row.insertCell();
  // cell2.innerHTML = '<b>Actioned</b>';
  // cell2.addEventListener("click", function() {
  //   sortData("actioned", "Property_id");
  // });

  // Create an empty <thead> element and add it to the table:
  var body = table.createTBody();

  recCount = 0;
  selectCount = 0;

  for (result of sqlResults) {
  
    if (includeRow(result))
    {
      let row = body.insertRow();

      recCount++;
      let storenum;
      //console.log(result);
      for (col of columnsToShow) {
        if (col.dbText != selectCol && col.dbText != "actioned") {
          var value = result[col.dbText];
          let cell = row.insertCell();
          cell.innerHTML = value;
          if (col.dbText == "Property_id") {
            storenum = value;
            cell.addEventListener("click", () => {
              console.log("clicked", value);
            });
          }
        }
      }

      for (let filter of filterArray) {
        var value = result[filter.filterName];
        let cell = row.insertCell();
        cell.innerHTML = value;
      }
      for (let sort of sortArray) {
        var value = result[sort.sortName];
        let cell = row.insertCell();
        cell.innerHTML = value;
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

      //---------------------------------------------
      // let actionCell = row.insertCell();
      // actionCell.innerHTML = result["actioned"];
      //=============================================
      row.className = "table-info";
    } else {
      result[selectCol] = false;
    }
  }

  let tableDiv = document.getElementById("TableDiv");
  tableDiv.innerHTML = "";
  tableDiv.appendChild(table);

  updateFooter();
}

function includeRow(rowData){

  for (let filter of filterArray) {
    if (filter.checked && filter.filterName != "actioned" && rowData[filter.filterName] != "TRUE") {
      return false;
    }
    if (filter.checked && filter.filterName == "actioned" && rowData[filter.filterName] == "TRUE") {
      return false;
    }
  }
  for (let sort of sortArray) {
    //check if value is between min and maxval
    if (rowData[sort.sortName] < sort.minVal || rowData[sort.sortName] > sort.maxVal) {
      return false;
    }
  }

  let ChkDivision = document.all.item("ChkDivision");
  let ChkRegion = document.all.item("ChkRegion");
  let ChkArea = document.all.item("ChkArea");
  let ChkFormat = document.all.item("ChkFormat");
  let ChkClosed = document.all.item("ChkClosed");
  let ChkSAG = document.all.item("ChkSAG");

  if (ChkDivision.checked) {
    let divisionValue = document.all.item("DivisionList").value; //10 // text is "14-London";
    if(rowData["division_id"] != divisionValue ) {return false};
  }

  if (ChkRegion.checked) {
    let regionValue = document.all.item("RegionList").value; //"10-Airports";
    if(rowData["region_id"] != regionValue ) {return false};
  }

  if (ChkArea.checked) {
    let areaValue = document.all.item("CAList").value; //"311-Heathrow%20Airport";
    if(rowData["customer_area_id"] != areaValue ) {return false};
  }

  if (ChkFormat.checked) {
    let formatValue = document.all.item("FormatList").value;
    if(rowData["trading_format"] != formatValue ) {return false};
  }

  if (ChkClosed.checked) {
    let closedOptions = document.all.item("ClosedList").options;
    for (let item of closedOptions) {
      if (item.selected) {
        if(rowData["property_type"] == item.value ) {return false};
      }
    }
  }

  if (ChkSAG.checked) {
    let sagValue = document.all.item("SAGList").value;
    if(!rowData["SAG"] || rowData["SAG"].substring(0,1) != sagValue ) {return false};
  }

  return true;
}

function updateFooter() {
  let refreshDiv = document.getElementById("refreshDiv");
  selectCount = 0
  actionCount = 0
  for (result of sqlResults) {
    if(result[selectCol] == true){
      selectCount ++;
    }
    if(result["actioned"] == "TRUE"){
      actionCount ++;
    }
  }

  refreshDiv.textContent = recCount + " record(s), " + selectCount + " selected. (" + actionCount + ") actioned.";
}

function buildFilterSection() {
  let filterDiv = document.getElementById("filterDiv");
  let filterButtonDiv = document.getElementById("filterButtonDiv");
  //console.log(filterArray);
  for (let filter of filterArray) {
    let div = document.createElement("div");
    let chkBox = document.createElement("input");
    chkBox.align = "left";
    chkBox.type = "checkbox";
    chkBox.name = "CHK" + filter.filterName;
    chkBox.checked = filter.checked;
    chkBox.addEventListener("click", () => {
      selectFilter(filter.filterName, chkBox.checked);
    });
    if(filter.filterName == "actioned"){
      div.textContent = "Excl. " + filter.filterName + "?";
    }else{
      div.textContent = filter.filterName + " Only?";
    }
    div.style = "margin-right:5px";
    div.insertBefore(chkBox, div.childNodes[0]);
    filterDiv.insertBefore(div, filterButtonDiv);
  }
  for (let sort of sortArray) {
    let div = document.createElement("div");

    //title
    let titleDiv = document.createElement("div");
    titleDiv.textContent = sort.sortName;
    //from
    let fromDiv = document.createElement("div");
    let fromInput = document.createElement("input");
    fromInput.value = sort.minVal;
    fromInput.name = "MIN" + sort.sortName;
    fromInput.addEventListener("change", () => {
      sort.minVal = fromInput.value;
    });
    fromDiv.appendChild(fromInput);
    //to
    let toDiv = document.createElement("div");
    let toInput = document.createElement("input");
    toInput.value = sort.maxVal;
    toInput.name = "MAX" + sort.sortName;
    toInput.addEventListener("change", () => {
      sort.maxVal = toInput.value;
    });
    toDiv.appendChild(toInput);

    div.appendChild(titleDiv);
    div.appendChild(fromDiv);
    div.appendChild(toDiv);

    div.style = "margin-right:5px";

    filterDiv.insertBefore(div, filterButtonDiv);
  }
}

function selectFilter(fName, ticked) {
  for (let filter of filterArray) {
    if (filter.filterName == fName) {
      filter.checked = ticked;
    }
  }
}

function selectStore(num, ticked) {
  for (result of sqlResults) {
    if (result["Property_id"] == num) {
      result[selectCol] = ticked;
      if (ticked) {
        selectCount++;
      } else {
        selectCount--;
      }
      updateFooter();
      return;
    }
  }
}

function toggleSelect(ticked) {
  //console.log(ticked);
  checkboxes = document.getElementsByName("chkGroup");
  for (var checkbox of checkboxes) {
    checkbox.checked = ticked;
  }
  for (result of sqlResults) {
    result[selectCol] = ticked;
  }
  if (ticked) {
    selectCount = recCount;
  } else {
    selectCount = 0;
  }
  updateFooter();
}

function mapResults(mapMode) {
  //let records = [];
  //let records = sqlResults.recordset;
  // let filters = {
  //   ChkColOnly: document.all.item("ChkColOnly").checked,
  //   ChkResOnly: document.all.item("ChkResOnly").checked,
  //   ChkDSPOnly: document.all.item("ChkDSPOnly").checked,
  //   ChkCHSOnly: document.all.item("ChkCHSOnly").checked
  // };
  // let filters = {};
  // for(let filter of filterArray){
  //   filters[filter.filterName]= document.all.item("CHK"+filter.filterName).checked
  // }

  //ipcRenderer.send('spawnMap', records,mapMode,filters);
  //ipcRenderer.send("spawnMap", sqlResults, mapMode, filters);
  ipcRenderer.send("spawnMap", sqlResults, mapMode, filterArray);
}

function exportResults(exportMode) {
  let outputString = "";
  for (result of sqlResults) {
    if (result[selectCol]) {
      let store = toFourDigits(result["Property_id"]);
      result["actioned"] = "TRUE";
      outputString += store + ",";
    }
  }
  if (outputString.length > 0) {
    outputString = outputString.slice(0, -1);

    switch (exportMode) {
      case "CLIP": {
        clipboard.writeText(outputString);
        break;
      }
      case "SCREEN": {
        ipcRenderer.send("showResultsWindow", outputString);
        break;
      }
      case "FILE": {
        let outputFilename = "storelist.csv";
        var file = new Blob([outputString], { type: "text" });
        if (window.navigator.msSaveOrOpenBlob)
          // IE10+
          window.navigator.msSaveOrOpenBlob(file, outputFilename);
        else {
          // Others
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
      default: {
        break;
      }
    }
    drawTableFromSQL();
  }
  console.log(outputString);
}

function toFourDigits(_storeNum) {
  let storeNum = "0000" + _storeNum;
  storeNum = storeNum.substr(-4);
  return storeNum;
}

ipcRenderer.on("initPageContent", function(e, _filterArray, _sortArray) {
  filterArray = _filterArray;
  sortArray = _sortArray;
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

  buildFilterSection();
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
