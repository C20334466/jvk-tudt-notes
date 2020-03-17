
// ------------------------------------- data -------------------------------------
const RUBRIC_ITEM_DATA_SEPARATOR="-----";
const RUBRIC_ITEM_DATA_DESCRIPTION =
      "A line should contain the rubric item description, min marks and max marks, separated by " + RUBRIC_ITEM_DATA_SEPARATOR + ", e.g.\n\n" + 
      "Quality of user experience" + RUBRIC_ITEM_DATA_SEPARATOR + "0" + RUBRIC_ITEM_DATA_SEPARATOR + "10\n" +
      "Program runs without errors" + RUBRIC_ITEM_DATA_SEPARATOR + "0" + RUBRIC_ITEM_DATA_SEPARATOR + "15";
const RUBRIC_ITEM_DATA_LENGTH = 3;

const ADD_SYMSTR = "+";
const REMOVE_SYMSTR = "-";
const MOVE_H_SYMSTR = "\u2194";
const MOVE_V_SYMSTR = "\u2195";

// ------------------------------------- initialisation -------------------------------------
// Array.prototype.forEach.call(document.getElementsByClassName("rubric"), function(table) { activate_ext_rubric_table(table); });
document.querySelectorAll(".rubric").forEach(function(table) { activate_ext_rubric_table(table); });


// -------------------------------------- generic -----------------------------
function create_text_area(cols, rows, placeholder, value) {
    let newElement = document.createElement("textarea");
    newElement.cols = cols;
    newElement.rows = rows;
    newElement.placeholder = placeholder;
    newElement.value = value;
    return newElement;
}

function create_button(name) {
    let newElement = document.createElement("button");
    newElement.type = "button";
    newElement.innerHTML = name;    
    return newElement;
}

function create_number_input_element(min, max, tab_index=0) {
    let nie = document.createElement("INPUT");
    nie.type = "number";
    nie.style.width = "3em";
    nie.min = min;
    nie.max = max;
    nie.value = max;
    nie.tabIndex = tab_index;
    return nie;
}


function insert_table_cell(row, header, child_element, pos = null) {
    let tc = document.createElement(header ? "TH" : "TD");
    tc.appendChild(typeof(child_element) == "string" ? document.createTextNode(child_element) : child_element);
    if (pos == null) {
	row.insertBefore(tc, null);
    } else {
	row.insertBefore(tc, row.cells[pos]);
    }
    return tc;
}

// restrict editing to one element
let editingElement = null;
function make_element_editable(element, event_type = "dblclick", stop_editing_function = function(ta) {
    return { close: true, value: ta.value };
}, get_data_func = function(element) { return element.innerHTML; }) {
    element.addEventListener(event_type, function() {
	event.stopPropagation();
	let innerHTML = element.innerHTML;
	if (!editingElement) {
	    let ta = create_text_area(20, 10, "", get_data_func(element));
	    element.innerHTML = "";
	    element.insertBefore(ta, null);
	    editingElement = element;
	    ta.select();

	    function handleEventDuringCellEdit() {
		if (event.type == "click" && event.target != ta) { processEndOfCellEdit(ta); }
		else if (event.type == "keydown") {
		    if (event.ctrlKey && event.code === "Space") { processEndOfCellEdit(ta); }
		    else if (event.code === "Escape") { closeTextArea(innerHTML); }
		}  
	    }
	    function closeTextArea(value) {
		ta.parentElement.innerHTML = value;
		editingElement = null;
		document.body.removeEventListener("click", handleEventDuringCellEdit);
		document.body.removeEventListener("keydown", handleEventDuringCellEdit);
	    }
	    function processEndOfCellEdit(ta) {
		let ret = stop_editing_function(ta);
		if (ret.close) { closeTextArea(ret.value ? ret.value : innerHTML); }
		else { ta.value = ret.value ? ret.value : innerHTML; ta.select(); }
	    }
	    document.body.addEventListener("click", handleEventDuringCellEdit);
	    document.body.addEventListener("keydown", handleEventDuringCellEdit);
	}
    }, );
}

function make_element_mouse_pointer_zone(element) {
    element.addEventListener("mouseover", function() {
	element.style.cursor = "pointer";
	element.addEventListener("mouseout", function() {
	    element.style.cursor = "default";
	}, { once: true} );
    });				
}


function closest_parent_of_type(element, type) {
    let currEl = element.parentElement;
    while(currEl && currEl.tagName != type) {
	currEl = currEl.parentElement;
    }
    return currEl;
}
	
// ------------------------ generic extensible table -------------------------------------------

function make_table_extensible(table, add_row_func, add_column_func) {
    // if the table is empty make it 1x1
    if (table.rows.length == 0) {
	insert_table_cell(table.insertRow(), true, "");
    }

    // create the add row
    let row = table.insertRow();
    make_ext_table_cell_add_handle(table, insert_table_cell(row, true, ADD_SYMSTR), true, add_row_func);
    let cellsToAdd = table.rows[0].cells.length - 1;
    for (let c = 0; c < cellsToAdd; ++c) {
	make_ext_table_cell_modify_handle(table, row.insertCell(), false);
    }

    // create the add column 
    make_ext_table_cell_add_handle(table, insert_table_cell(table.rows[0], true, ADD_SYMSTR), false, add_column_func);
    for (let r = 1; r < table.rows.length - 1; ++r) {
	make_ext_table_cell_modify_handle(table, table.rows[r].insertCell(), true);
    }

    activate_ext_table_editable_headers(table);
    style_ext_table_handle_elements(table);
}

function activate_ext_table_handle_common(element) {
    make_element_mouse_pointer_zone(element);
    style_ext_table_handle_element(element);
}

function style_ext_table_handle_element(element) {
    element.style.fontSize = "2em";
    element.style.fontWeight = "bold";
}

function style_ext_table_handle_elements(table) {
    document.querySelectorAll("[class$=\"-handle\"]").forEach(style_ext_table_handle_element);
}


function activate_ext_table(table, row_add_func, col_add_func) {
    activate_ext_table_editable_headers(table);
    document.querySelectorAll(".add-row-handle").forEach(function(element) { activate_ext_table_add_element(table, element, row_add_func); });
    document.querySelectorAll(".add-col-handle").forEach(function(element) { activate_ext_table_add_element(table, element, col_add_func); });
    document.querySelectorAll(".del-row-handle").forEach(function(element) { activate_ext_table_delete_handle(table, element, true); });
    document.querySelectorAll(".del-col-handle").forEach(function(element) { activate_ext_table_delete_handle(table, element, false); });
    document.querySelectorAll(".mv-row-handle").forEach(function(element) { activate_ext_table_move_handle(table, element, true); });
    document.querySelectorAll(".mv-col-handle").forEach(function(element) { activate_ext_table_move_handle(table, element, false); });
}
							       
function activate_ext_table_editable_headers(table) {
    if (table.rows.length == 0) {
	return;
    }
    
    let r1Cells = table.rows[0].cells;
    for (let c = 1; c < r1Cells.length - 1; ++c) {
	make_element_editable(r1Cells[c]);
    }
 
    let rows = table.rows;
    for (let r = 1; r < rows.length - 1; ++r) {
	make_element_editable(rows[r].cells[0]);
    }
}

function make_ext_table_cell_add_handle(table, cell, row, add_func) {
    let className = "add-" + (row ? "row" : "col") + "-handle";
    cell.innerHTML = "<div style=\"text-align:center;\" class=\"" + className + "\">" + ADD_SYMSTR + "</div>";
    activate_ext_table_add_element(table, cell.querySelector("." + className), add_func);
}

function activate_ext_table_add_element(table, element, add_func) {
    activate_ext_table_handle_common(element);
    
    make_element_editable(element, "click", function(ta) { if (ta.value != ADD_SYMSTR) { return add_func(ta); } else { return { close: true, value: null }; } });
}


function make_ext_table_cell_modify_handle(table, cell, row, vertical=true) {
    let rowColStr = row ? "row" : "col";
    cell.innerHTML =
	"<div style=\"display:flex;justify-content:space-evenly;align-items:center;" + (vertical ? "flex-direction:column;" : "width:3em;") + "\">" +
	"<div class=\"del-" + rowColStr + "-handle\">"+ REMOVE_SYMSTR + "</div>" +
	"<div class=\"mv-" + rowColStr + "-handle\">" + (row ? MOVE_V_SYMSTR : MOVE_H_SYMSTR) + "</div></div>";
    
    let index = row ? cell.parentElement.rowIndex : cell.cellIndex;
    activate_ext_table_delete_handle(table, cell.querySelector(".del-" + rowColStr + "-handle"), row);
    activate_ext_table_move_handle(table, cell.querySelector(".mv-" + rowColStr + "-handle"), row);
}
   

let draggedRow = null;
let draggedCol = null;
function activate_ext_table_move_handle(table, element, row) {
    activate_ext_table_handle_common(element);
    
    element.draggable = true;

    if (row) {
	element.addEventListener("dragstart", function() {
	    draggedRow = closest_parent_of_type(event.target, "TR");
	    draggedRow.style.background = "tomato";
	});

	element.addEventListener("dragend", function() {
	    if (draggedRow) {
		draggedRow.style.background = "";
		draggedRow = null;
	    }
	});

	let elementRow = closest_parent_of_type(element, "TR");
	elementRow.addEventListener("dragover", function() {
	    event.preventDefault();
	});

	elementRow.addEventListener("dragenter", function() {
	    if (draggedRow) {
		let parent = draggedRow.parentNode; 
		let newIndex = this.rowIndex;
		parent.removeChild(draggedRow);
		parent.insertBefore(draggedRow, table.rows[newIndex]);
	    }
	});
	
	elementRow.addEventListener("dragleave", function() {
	});
	
	elementRow.addEventListener("drop", function() {
	});
    } else {
	element.addEventListener("dragstart", function() {
	    draggedCol = get_ext_table_column(table, closest_parent_of_type(event.target, "TD").cellIndex, true);
	    draggedCol.forEach(function(cell) { cell.style.background = "tomato"; });
	});

	element.addEventListener("dragend", function() {
	    if (draggedCol) {
		draggedCol.forEach(function(cell) { cell.style.background = ""; });
		draggedCol = null;
	    }
	});

	get_ext_table_column(table, closest_parent_of_type(element, "TD").cellIndex, true).forEach(function(cell) { activate_ext_table_column_move_target_cell(table, cell) });
    }
}

function activate_ext_table_column_move_target_cell(table, cell) {
    cell.addEventListener("dragover", function() {
	event.preventDefault();
    });
    
    cell.addEventListener("dragenter", function() {
	if (draggedCol) {
	    let newIndex = this.cellIndex;
	    if (newIndex != draggedCol[0].cellIndex) {
		draggedCol.forEach(function(cell,index) {
		    let parent = cell.parentNode; 
		    parent.removeChild(cell);
		    parent.insertBefore(cell, table.rows[index].cells[newIndex]);
		});
	    }
	}
    });
    
    cell.addEventListener("dragleave", function() {
    });
    
    cell.addEventListener("drop", function() {
    });
}


function activate_ext_table_delete_handle(table, element, row) {
    activate_ext_table_handle_common(element);
	
    element.addEventListener("click", function() {
	if (row) {
	    table.deleteRow(closest_parent_of_type(element, "TR").rowIndex);
	} else {
	    delete_ext_table_column(table, closest_parent_of_type(element, "TD").cellIndex);
	}
    });
}

function insert_ext_table_row(table, row_data, row_number) {
    if (row_number == -1) {
	row_number = table.rows.length - 1;
    }
    let row = table.insertRow(row_number);
    make_element_editable(insert_table_cell(row, true, row_data[0]));
    for (let d = 1; d < row_data.length; ++d) {
	let cell = row.insertCell();
	cell.appendChild(row_data[d]);
	activate_ext_table_column_move_target_cell(table, cell);
    }
    make_ext_table_cell_modify_handle(table, row.insertCell(), true);

    rubric_table_assign_tabindex_values(table);

    
}

function insert_ext_table_column(table, col_data, col_number) {
    if (col_number == -1) {
	col_number = table.rows[0].cells.length - 1;
    }
    make_element_editable(insert_table_cell(table.rows[0], true, col_data[0], col_number));
    for (let d = 1; d < col_data.length; ++d) {
	table.rows[d].insertCell(col_number).appendChild(col_data[d]);
    }
    make_ext_table_cell_modify_handle(table, table.rows[table.rows.length - 1].insertCell(col_number), false);
    
    rubric_table_assign_tabindex_values(table);
}

function get_ext_table_column(table, col_number, include_meta_cells=false) {
    if (col_number == -1) {
	col_number = table.rows[0].cells.length - 1;
    }
    let column = [];
    for (let r = 0; r < table.rows.length - 1; ++r) {
	column.push(table.rows[r].cells[col_number]);
    }
    if (include_meta_cells) {
	column.push(table.rows[table.rows.length - 1].cells[col_number]);
    }
    return column;
}

function delete_ext_table_column(table, col_number) {
    if (col_number == -1) {
	col_number = table.rows[0].cells.length - 1;
    }
    for (let r = 0; r < table.rows.length; ++r) {
	table.rows[r].deleteCell(col_number);
    }
}

// ------------------------ specific -------------------------------------------


function create_feedback_text_element() {
    let divFE = document.createElement("SPAN");
    divFE.innerHTML = "F";
    make_feedback_text_element_editable(divFE);
    activate_ext_table_handle_common(divFE);
    return divFE;
}


function make_feedback_text_element_editable(element) {
    if (!element.getAttribute("data-text")) {
	element.setAttribute("data-text", "");
    }
    element.style.color = "gray";
    make_element_editable(element, "dblclick", function(ta) {
	ta.parentElement.setAttribute("data-text", ta.value);
	element.style.color = ta.value ? "black" : "gray";
	return { close: true, value: null} ; 
    }, function(element) {
	return element.getAttribute("data-text");
    });
}

function parse_rubric_item(item_string) {
    let dataArray = item_string.split(RUBRIC_ITEM_DATA_SEPARATOR);
    if (dataArray.length != RUBRIC_ITEM_DATA_LENGTH) {
	alert("Rubric item '" + dataArray[0] + "' is not in the right format.\n\n" + RUBRIC_ITEM_DATA_DESCRIPTION);
	return null;
    }

    let min = parseInt(dataArray[1].trim());
    let max = parseInt(dataArray[2].trim());
    if (isNaN(min) || isNaN(max)) {
	alert("The min and max marks for rubric item '" + dataArray[0] + "' should be numbers.\n\n" + RUBRIC_ITEM_DATA_DESCRIPTION);
	return null;
    }

    return { name: dataArray[0], min: min, max: max }
}

function rubric_table_assign_tabindex_values(table) {
    let rows = table.rows;
    let numRowsLess1 = rows.length - 1;
    let numRowsLess2 = numRowsLess1 - 1;
    let numColsLess1 = rows[0].cells.length - 1;
    for (let r = 1; r < numRowsLess1; ++r) {
	let cells = rows[r].cells;
	for (let c = 1; c < numColsLess1; ++c) {
	    cells[c].childNodes[0].childNodes[0].tabIndex = (c - 1) * numRowsLess2 + r;
	}
    }
}


function rubric_table_row_from_rubric_item_string(table, rubric_item_string, row_number) {
    if (row_number == -1) {
	row_number == table.rows.length - 1;
    }
    let ri = parse_rubric_item(rubric_item_string);
    if (!ri) { return false; }
    if (table.rows[0].cells.length == 2) {
	rubric_table_column_from_name(table, "MAX", 1);
    }
    let rowData = [ document.createTextNode(ri.name) ];
    for (let c = 1; c < table.rows[0].cells.length - 1; ++c) {
	let divElement = document.createElement("DIV");
	divElement.style.display = "flex";
	divElement.style.flexDirection = "column";
	divElement.style.alignItems = "center";
	divElement.style.justifyContent = "space-evenly";
	divElement.style.height = "100%";
	divElement.appendChild(create_number_input_element(ri.min, ri.max));
	divElement.appendChild(create_feedback_text_element());
	rowData.push(divElement);
    }
    
    insert_ext_table_row(table, rowData, row_number);
    rubric_table_assign_tabindex_values(table);
    return true;
}

function rubric_table_column_from_name(table, name, column_number) {
    if (column_number == -1) {
	column_number = table.rows[0].cells.length - 1;
    }
    let colData = [ name ];
    if (table.rows.length > 2) {
	if (table.rows[0].cells.length == 2) {
	    console.error("Rubric inconsistency: name being added to table with rubric items but without mark information.");
	    return true;
	}
	let prevCol = get_ext_table_column(table, column_number - 1);
	for (let r = 1; r < prevCol.length; ++r) {
	    colData.push(prevCol[r].firstChild.cloneNode(true));
	}
    }
    insert_ext_table_column(table, colData, column_number);
    rubric_table_assign_tabindex_values(table);
    return true;
}


function rubric_add_row_func(table, ta) {
    if (rubric_table_row_from_rubric_item_string(table, ta.value, table.rows.length - 1)) {
	return { close: true, value: null }
    } 
    return { close: false, value: ta.value };
}
function rubric_add_col_func(table, ta) { rubric_table_column_from_name(table, ta.value, table.rows[0].cells.length - 1); return { close: true, value: null } }

function activate_ext_rubric_table(table) {
    activate_ext_table(table,  function(ta) { return rubric_add_row_func(table, ta); }, function(ta) { return rubric_add_col_func(table, ta); });

    document.querySelectorAll(".edit-feedback-handle").forEach(function(element) {
	make_feedback_text_element_editable(element);
	activate_ext_table_handle_common(element);
    });
}

 
function make_rubric(element) {
    let parent = element.parentElement;
    let ta1 = create_text_area(20, 20, "Enter the names here e.g.\n\nAmy Aiken\nBilly Blas\nConor Crumb\n", "");
    parent.insertBefore(ta1, element);
    let ta2 = create_text_area(50, 20, "Enter the rubric items here, one item per line.\n\n" + RUBRIC_ITEM_DATA_DESCRIPTION, "");
    parent.insertBefore(ta2, element);
    let button = create_button("Submit");
    parent.insertBefore(button, element);
    parent.removeChild(element);
    
    button.addEventListener("click", function() {
	let table = document.querySelector("table.rubric");
	make_table_extensible(table, function(ta) { return rubric_add_row_func(table, ta); }, function(ta) { return rubric_add_col_func(table, ta); });
		
	ta1.value.split("\n").filter(item => item).forEach(function(item) { rubric_table_column_from_name(table, item.trim(), -1); });

	ta2.value.split("\n").filter(item => item).forEach(function(item) { rubric_table_row_from_rubric_item_string(table, item, -1); });

	ta1.remove();
	ta2.remove();
	button.remove();
    });
}



function save_results(module, ca) {
    
    let table = document.querySelector("table.rubric");

    if (!table || !table.rows.length) {
	alert("Table is empty. Nothing to save.");
	return;
    }

    let rows = table.querySelectorAll("tr");
    
    let headerRowCells = rows[0].querySelectorAll("th");
    let totals = new Array(headerRowCells.length - 2).fill(0);
    let resultDocs = new Array(headerRowCells.length - 2).fill("<!DOCTYPE html><html><head><style>" + 
							       "th{text-align:left;padding-right:1em;}" +
							       "td,th{border:0.5px solid gray;}" +
							       "table{border-collapse:collapse;}" +
							       "</style></head><body>");
    let names = new Array(headerRowCells.length - 2).fill("");
    for (let h = 1; h < headerRowCells.length - 1; ++h) {
	names[h - 1] = headerRowCells[h].innerHTML.replace(/<br\/?>/, " ");
	resultDocs[h - 1] += "<h2>" + names[h - 1] + "</h2><h3>" + module + " CA" + ca + "</h3><table>";
    }
    let maxTotal = 0;
    for (let r = 1; r < rows.length - 1; ++r) {
	let rowHeader = rows[r].querySelector("th");
	let rowDataElements = rows[r].querySelectorAll("td");
	for (let d = 0; d < rowDataElements.length - 1; ++d) {
	    resultDocs[d] += "<tr><th style=\"min-width:15em;\">" + rowHeader.innerHTML.replace(/\n/g, "<br/>") + "</th>";
	    let inputElement = rowDataElements[d].querySelector("input");
	    let feedbackElement = rowDataElements[d].querySelector("span[data-text]");
	    let mark = +inputElement.value;
	    let maxMark = +inputElement.max;
	    totals[d] += mark;
	    if (d == 1) { maxTotal += maxMark; }
	    resultDocs[d] +=
		"<td style=\"text-align:right;border-right:none;padding-left:1em;\">" + mark + "/</td>" +
		"<td style=\"text-align:left;border-left:none;padding-right:1em;\">" + maxMark  + "</td>" +
		"<td style=\"padding:0.2em 1em;\">" + feedbackElement.getAttribute("data-text").replace(/\n/g, "<br/>") + "</td></tr>";
	}
    }

    for (let d = 0; d < resultDocs.length; ++d) {
	let percentage = totals[d]/maxTotal*100;
	resultDocs[d] += "</table><p>Your result for CA" + ca + " is <strong>" + percentage.toFixed(2) + "%</strong>.</p></body></html>";
    }

    for (let d = 0; d < resultDocs.length; ++d) {
	const blob = new Blob([resultDocs[d]], { type: 'text/html' });
	const fileName = names[d] + ".html";
	let newLink = document.createElement("a");
	newLink.download = fileName;
	if (window.webkitURL != null) {
	    newLink.href = window.webkitURL.createObjectURL(blob);
	}
	else {
	    newLink.href = window.URL.createObjectURL(blob);
	    newLink.style.display = "none";
	    document.body.appendChild(newLink);
	}
	
	newLink.click();
    }
}


function export_to_csv() {
    let csvContents = "";
    
    let table = document.querySelector("table.rubric");
    if (!table || !table.rows.length) {
	alert("Table is empty. Nothing to export.");
	return;
    }
    
    let rows = table.rows;

    // first line (names)
    let cells = rows[0].cells;
    let numCellsLess2 = cells.length - 2;    
    for (let c = 0; c < numCellsLess2; ++c) {
	csvContents += cells[c].textContent;
	csvContents += ",";
    }
    csvContents += cells[numCellsLess2].textContent;
    csvContents += "\n";

    // create an array for the total marks by person (position 0 will hold the max marks)
    let marksArray = new Array(cells.length - 1).fill(0);
    
    // alternating marks and feedback lines, percentage calculation
    let numRowsLess1 = rows.length - 1;
    for (let r = 1; r < numRowsLess1; ++r) {
	cells = rows[r].cells;
	numCellsLess2 = cells.length - 2;
	// marks
	csvContents += "\"" + cells[0].textContent + " (marks)" + "\"";
	csvContents += ",";
	for (let c = 1; c < numCellsLess2; ++c) {
	    csvContents += cells[c].firstChild.firstChild.value;
	    csvContents += ",";
	    marksArray[c] += +cells[c].firstChild.firstChild.value;
	}
	csvContents += cells[numCellsLess2].firstChild.firstChild.value;
	csvContents += "\n";
	marksArray[numCellsLess2] += +cells[numCellsLess2].firstChild.firstChild.value;
	marksArray[0] += +cells[1].firstChild.firstChild.max;
	
	// feedback
	csvContents += "\"" + cells[0].textContent + " (feedback)" + "\"";
	csvContents += ",";
	for (let c = 1; c < numCellsLess2; ++c) {
	    csvContents += "\"" + cells[c].firstChild.lastChild.getAttribute("data-text") + "\"";
	    csvContents += ",";
	}
	csvContents += "\"" + cells[numCellsLess2].firstChild.lastChild.getAttribute("data-text") + "\"";
	csvContents += "\n";
    }

    // percentages
    for (c = 0; c < numCellsLess2; ++c) {
	let percentage = marksArray[c]/marksArray[0]*100;
	csvContents += percentage.toFixed(2);
	csvContents += ",";
    }
    let percentage = marksArray[numCellsLess2]/marksArray[0]*100;
    csvContents += percentage.toFixed(2);
    csvContents += "\n";

    // write the file
    const blob = new Blob([csvContents], { type: 'text' });
    let newLink = document.createElement("a");
    newLink.download = "rubric_backup.csv";
    if (window.webkitURL != null) {
	newLink.href = window.webkitURL.createObjectURL(blob);
    }
    else {
	newLink.href = window.URL.createObjectURL(blob);
	newLink.style.display = "none";
	document.body.appendChild(newLink);
    }
    
    newLink.click();
}
