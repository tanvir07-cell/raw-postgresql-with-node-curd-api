import express from "express";
import pg from "pg";
import { globalErrorHandler } from "./middleware/error.js";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use([cors(), express.json(), morgan("dev")]);

// postgreSql connection port :
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

app.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`SELECT * FROM users WHERE id=$1`, [id]);
    if (!rows[0]) {
      const error = new Error();
      error.message = "User not found";
      error.status = 404;
      next(error);
    }
    return res.status(200).json({
      message: "User found",
      user: rows[0] || "user not found",
    });
  } catch (err) {
    next(err);
  }
});

app.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT *, COUNT(*) OVER():: INT AS total_user FROM users"
    );
    return res.status(200).json({
      message: "ALl users are here",
      users: rows,
    });
  } catch (err) {
    next(err);
  }
});

app.post("/", async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!email || !name) {
      const err = new Error();
      err.message = "Please provide name and email";
      err.status = 400;
      next(err);
    }

    const { rows } = await pool.query(
      `INSERT INTO users (name,email) VALUES ($1,$2) RETURNING *`,
      // This is the way to prevent sql injection using [name,email]
      [name, email]
    );
    return res.status(201).json({
      message: "User created successfully",
      user: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

app.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(`DELETE FROM users WHERE id=$1`, [id]);

    return res.status(200).json({ message: "DELETED SUCCESSFULLY" });
  } catch (err) {
    next(err);
  }
});

app.put("/:id", async (req, res, next) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    if (!email || !name) {
      const err = new Error();
      err.message = "Please provide name or email to update data";
      err.status = 400;
      return next(err);
    }

    const { rows } = await pool.query(`SELECT * FROM users WHERE id=$1`, [id]);

    if (!rows[0]) {
      const { rows } = await pool.query(
        `INSERT INTO users (name,email) VALUES ($1,$2) RETURNING *`,
        // This is the way to prevent sql injection using [name,email]
        [name, email]
      );
      return res.status(201).json({
        message: "User created successfully",
        user: rows[0],
      });
    } else {
      const { rows } = await pool.query(
        `UPDATE users SET name=$1,email=$2 WHERE id=$3 RETURNING *`,
        [name, email, id]
      );
      return res.status(200).json({
        message: "User updated successfully",
        user: rows[0],
      });
    }
  } catch (err) {
    next(err);
  }
});

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
