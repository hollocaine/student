const router = require('express').Router();

const jwt = require('jsonwebtoken');
const passport = require('passport');

// Input validation package
// https://www.npmjs.com/package/validator
const validator = require('validator');

// require the database connection
const { sql, dbConnPoolPromise } = require('../database/db.js');

// Define SQL statements here for use in function below
// These are parameterised queries note @named parameters.
// Input parameters are parsed and set before queries are executed

// for json path - Tell MS SQL to return results as JSON

const SQL_SELECT_ALL =
  'SELECT dbo.student.* FROM dbo.student ORDER BY dbo.student.stud_sname ASC for json path;';

// for json path, without_array_wrapper - use for single json result
const SQL_SELECT_BY_ID =
  'SELECT * FROM dbo.student WHERE stud_id = @id for json path, without_array_wrapper;';

// for json path, without_array_wrapper - use for single json result
const SQL_SELECT_BY_GRADEID =
  'SELECT grade FROM dbo.student,dbo.grade WHERE stud_id= @id ORDER BY stud_sname ASC for json path;';
const SQL_INSERT =
  'INSERT INTO dbo.student (stud_id, stud_fname, stud_sname, stud_email) VALUES (@stud_id, @stud_fname, @stud_sname, @stud_email); SELECT * from dbo.student WHERE stud_id = SCOPE_IDENTITY();';
//, @stud_address, @stud_city, @stud_gender, @stud_dob, @stud_class, @stud_date_started, @supervisor_id, @dept_code
//, stud_address, stud_city, stud_gender, stud_dob, stud_class, stud_date_started, supervisor_id, dept_code
const SQL_UPDATE =
  'UPDATE dbo.student SET stud_fname = @stud_fname, stud_sname = @stud_sname, stud_email = @stud_email WHERE stud_id = @id; SELECT * FROM dbo.student WHERE stud_id = @id;';
//, stud_address = @stud_address, stud_city = @stud_city, stud_gender = @stud_gender,  stud_dob = @stud_dob, stud_class = @stud_class, stud_date_started = @stud_date_started, supervisor_id = @supervisor_id, dept_code = @dept_code
const SQL_DELETE = 'DELETE FROM dbo.student WHERE stud_id = @id;';

// GET listing of all students
// Address http://server:port/student
// returns JSON
router.get('/', async (req, res) => {
  // Get a DB connection and execute SQL
  try {
    const pool = await dbConnPoolPromise;
    const result = await pool
      .request()
      // execute query
      .query(SQL_SELECT_ALL);

    // Send HTTP response.
    // JSON data from MS SQL is contained in first element of the recordset.
    res.json(result.recordset[0]);

    // Catch and send errors
  } catch (err) {
    res.status(500);
    res.send(err.message);
  }
});

// GET a single student by id
// id passed as parameter via url
// Address http://server:port/student/:id
// returns JSON
router.get('/:id', async (req, res) => {
  // read value of id parameter from the request url
  const stud_id = req.params.id;

  // Validate input - important as a bad input could crash the server or lead to an attack
  // See link to validator npm package (at top) for doc.
  // If validation fails return an error message
  if (!validator.isNumeric(stud_id, { no_symbols: true })) {
    res.json({ error: 'invalid id parameter' });
    return false;
  }

  // If validation passed execute query and return results
  // returns a single student with matching id
  try {
    // Get a DB connection and execute SQL
    const pool = await dbConnPoolPromise;
    const result = await pool
      .request()
      // set name parameter(s) in query
      .input('id', sql.Int, stud_id)
      // execute query
      .query(SQL_SELECT_BY_ID);

    // Send response with JSON result
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500);
    res.send(err.message);
  }
});

// GET students by category id
// id passed as parameter via url
// Address http://server:port/student/:id
// returns JSON
router.get('/:id', async (req, res) => {
  // read value of id parameter from the request url
  const stud_id = req.params.id;

  // Validate input - important as a bad input could crash the server or lead to an attack
  // See link to validator npm package (at top) for doc.
  // If validation fails return an error message
  if (!validator.isNumeric(stud_id, { no_symbols: true })) {
    res.json({ error: 'invalid id parameter' });
    return false;
  }

  // If validation passed execute query and return results
  // returns a single student with matching id
  try {
    // Get a DB connection and execute SQL
    const pool = await dbConnPoolPromise;
    const result = await pool
      .request()
      // set name parameter(s) in query
      .input('id', sql.Int, stud_id)
      // execute query
      .query(SQL_SELECT_BY_GRADEID);

    // Send response with JSON result
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500);
    res.send(err.message);
  }
});

// POST - Insert a new student.
// This async function sends a HTTP post request
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    // Validate - this string, inially empty, will store any errors
    let errors = '';

    // Escape text and potentially bad characters
    const stud_sname = validator.escape(req.body.stud_sname);
    if (stud_sname === '') {
      errors += 'invalid stud_sname; ';
    }
    const stud_fname = validator.escape(req.body.stud_fname);
    if (stud_fname === '') {
      errors += 'invalid stud_fname; ';
    }
    // Make sure that email is valid
    const stud_email = req.body.stud_email;
    if (!validator.isEmail(stud_email, { no_symbols: true })) {
      errors += 'invalid stud_email; ';
    }
    // Validate grade
    const stud_grade = req.body.stud_grade;
    if (!validator.isNumeric(stud_grade, { no_symbols: true })) {
      res.json({ error: 'invalid id parameter' });
      return false;
    }

    // If errors send details in response
    if (errors != '') {
      // return http response with  errors if validation failed
      res.json({ error: errors });
      return false;
    }

    // If no errors, insert
    try {
      // Get a DB connection and execute SQL
      const pool = await dbConnPoolPromise;
      const result = await pool
        .request()
        // set named parameter(s) in query
        .input('stud_sname', sql.NVarChar, stud_sname)
        .input('stud_fname', sql.NVarChar, stud_fname)
        .input('stud_email', sql.NVarChar, stud_email)
        .input('stud_grade', sql.Int, stud_grade)
        // Execute Query
        .query(SQL_INSERT);

      // If successful, return inserted student via HTTP
      res.json(result.recordset[0]);
    } catch (err) {
      res.status(500);
      res.send(err.message);
    }
  }
);

// PUT update student
// Like post but stud_id is provided and method = put
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    // Validate input values (sent in req.body)
    let errors = '';
    const stud_id = req.params.id;
    const stud_sname = validator.escape(req.body.stud_sname);
    if (stud_sname === '') {
      errors += 'invalid stud_sname; ';
    }
    const stud_fname = validator.escape(req.body.stud_fname);
    if (stud_fname === '') {
      errors += 'invalid stud_fname; ';
    }
    // Make sure that email is valid
    const stud_email = req.body.stud_email;
    if (!validator.isEmail(stud_email, { no_symbols: true })) {
      errors += 'invalid stud_email; ';
    }

    // If errors send details in response
    if (errors != '') {
      // return http response with  errors if validation failed
      res.json({ error: errors });
      return false;
    }

    // If no errors
    try {
      // Get a DB connection and execute SQL
      const pool = await dbConnPoolPromise;
      const result = await pool
        .request()
        // set parameters
        .input('id', sql.Int, stud_id)
        .input('stud_sname', sql.NVarChar, stud_sname)
        .input('stud_fname', sql.NVarChar, stud_fname)
        .input('stud_email', sql.NVarChar, stud_email)
        // run query
        .query(SQL_UPDATE);

      // If successful, return updated student via HTTP
      res.json(result.recordset[0]);
    } catch (err) {
      res.status(500);
      res.send(err.message);
    }
  }
);

// DELETE single task.
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    // Validate
    const stud_id = req.params.id;

    // If validation fails return an error message
    if (!validator.isNumeric(stud_id, { no_symbols: true })) {
      res.json({ error: 'invalid id parameter' });
      return false;
    }

    // If no errors try delete
    try {
      // Get a DB connection and execute SQL
      const pool = await dbConnPoolPromise;
      const result = await pool
        .request()
        .input('id', sql.Int, stud_id)
        .query(SQL_DELETE);

      const rowsAffected = Number(result.rowsAffected);

      let response = { deletedId: null };

      if (rowsAffected > 0) {
        response = { deletedId: stud_id };
      }

      res.json(response);
    } catch (err) {
      res.status(500);
      res.send(err.message);
    }
  }
);

module.exports = router;
