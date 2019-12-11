// JavaScript for the student page
//

// CRUD operations

// Parse JSON
// Create student rows
// Display in web page
//SELECT dbo.student.stud_id, stud_fname, stud_sname, stud_grade FROM dbo.student, dbo.grade WHERE dbo.grade.stud_id = dbo.student.stud_id AND dbo.student.stud_id =@stud_id

function displaystudents(students) {
  // Use the Array map method to iterate through the array of students (in json format)
  // Each students will be formated as HTML table rowsand added to the array
  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
  // Finally the output array is inserted as the content into the <tbody id="studentRows"> element.

  const rows = students.map(student => {
    // returns a template string for each student, values are inserted using ${ }
    // <tr> is a table row and <td> a table division represents a column
    let row = `<tr>
                <td>${student.stud_id}</td>
                <td>${student.stud_fname}</td>
                <td>${student.stud_sname}</td>
                <td>${student.stud_email}</td>
                `;

    // If user logged in then show edit and delete buttons
    // To add - check user role
    if (userLoggedIn() === true) {
      row += `<td><button class="btn btn-xs" data-toggle="modal" data-target="#studentFormDialog" onclick="preparestudentUpdate(${student.stud_id})"><span class="oi oi-pencil"></span></button></td>
                   <td><button class="btn btn-xs" onclick="deletestudent(${student.stud_id})"><span class="oi oi-trash"></span></button></td>`;
    }
    row += '</tr>';

    return row;
  });

  // Set the innerHTML of the studentRows root element = rows
  // Why use join('') ???
  document.getElementById('studentRows').innerHTML = rows.join('');
} // end function

// load and display grades in a bootstrap list group
function displayGrades(grades) {
  //console.log(grades);
  const items = grades.map(grade => {
    return `<a href="#" class="list-group-item list-group-item-action" onclick="updateStudentsGradesView(${grade.grade_id})">${grade.grade}</a>`;
  });

  // Add an All grades link at the start
  items.unshift(
    `<a href="#" class="list-group-item list-group-item-action" onclick="loadstudents()">Show all</a>`
  );

  // Set the innerHTML of the studentRows root element = rows
  document.getElementById('gradeList').innerHTML = items.join('');
} // end function

// Get all grades and students then display
async function loadstudents() {
  try {
    const grades = await getDataAsync(`${BASE_URL}grade`);
    displayGrades(grades);

    const students = await getDataAsync(`${BASE_URL}student`);
    displaystudents(students);
  } catch (err) {
    // catch and log any errors
    console.log(err);
  }
}

// update students list when category is selected to show only students from that category
async function updateStudentsGradesView(id) {
  try {
    const students = await getDataAsync(`${BASE_URL}student/${id}`);
    displaystudents(students);
  } catch (err) {
    // catch and log any errors
    console.log(err);
  }
}

// When a student is selected for update/ editing, get it by id and fill out the form
async function preparestudentUpdate(id) {
  try {
    // Get broduct by id
    const student = await getDataAsync(`${BASE_URL}student/${id}`);
    // Fill out the form
    document.getElementById('stud_id').value = student.stud_id; // uses a hidden field - see the form
    document.getElementById('stud_sname').value = student.stud_sname;
    document.getElementById('stud_fname').value = student.stud_fname;
    document.getElementById('stud_email').value = student.stud_email;
  } catch (err) {
    // catch and log any errors
    console.log(err);
  }
}

// Called when form submit button is clicked
async function addOrUpdateStudent() {
  // url
  let url = `${BASE_URL}student`;

  // Get form fields
  const sStudId = Number(document.getElementById('stud_id').value);
  const sFname = document.getElementById('stud_fname').value;
  const sSname = document.getElementById('stud_sname').value;
  const sStudEmail = document.getElementById('stud_email').value;

  // build request body
  const reqBody = JSON.stringify({
    stud_fname: sFname,
    stud_sname: sSname,
    stud_email: sStudEmail
  });

  // Try catch
  try {
    let json = '';
    // determine if this is an insert (POST) or update (PUT)
    // update will include student id
    if (sStudId > 0) {
      url += `/${sStudId}`;
      json = await postOrPutDataAsync(url, reqBody, 'PUT');
    } else {
      json = await postOrPutDataAsync(url, reqBody, 'POST');
    }
    // Load students
    loadstudents();
    // catch and log any errors
  } catch (err) {
    console.log(err);
    return err;
  }
}

// Delete student by id using an HTTP DELETE request
async function deletestudent(id) {
  if (confirm('Are you sure?')) {
    // url
    const url = `${BASE_URL}student/${id}`;

    // Try catch
    try {
      const json = await deleteDataAsync(url);
      console.log('response: ' + json);

      loadstudents();

      // catch and log any errors
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}

// Show student button
function showAddstudentButton() {
  let addstudentButton = document.getElementById('AddstudentButton');

  if (userLoggedIn() === true) {
    addstudentButton.style.display = 'block';
  } else {
    addstudentButton.style.display = 'none';
  }
}

// show login or logout
showLoginLink();

// Load students
loadstudents();

showAddstudentButton();
