const router = require("express").Router();
const fs = require("fs");
const { exec } = require("child_process");
const codeHelper = require("../Helpers/codeHelper");

router.post("/run", (req, res) => {
  // Retrieve request body items
  const code = req.body.code;
  console.log("code is: " + code);
  const input = req.body.input;
  const id = req.body.id;
  console.log("id is: " + id);
  const lang = req.body.lang;
  console.log("lang is: " + lang);

  // Ensure id and lang are valid
  if (!id || !lang) {
    console.log("invalid id or lang");
    return res.status(400).json({ error: "Invalid id or language specified" });
  }

  // Extension of source code file
  const sourceExt = {
    cpp: ".cpp",
    java: ".java",
    python: ".py",
  };

  // Compile and run command
  const command = {
    cpp: `cd ${id} && g++ Main.cpp -o out && ./out < input.txt`,
    java: `cd ${id} && javac Main.java && java Main < input.txt`,
    python: `cd ${id} && python Main.py < input.txt`,
  };

  // Ensure command for the specified language is valid
  if (!command[lang]) {
    return res.status(400).json({ error: "Unsupported language specified" });
  }

  // Step 1: Make unique directory and 2 files inside directory and copy source code and input to it.
  try {
    codeHelper.createDir(id);
    codeHelper.createFile(`./${id}/Main`, sourceExt[lang], code);
    codeHelper.createFile(`./${id}/input`, ".txt", input);
  } catch (error) {
    return res.status(500).json({ error: "Error creating files" });
  }

  // Step 2: Execute child process to generate output
  // exec opens a new terminal and executes the command
  exec(command[lang], (error, stdout, stderr) => {
    // Step 3: Delete directory
    codeHelper.removeDir(id);

    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json(`Error executing command: ${error.message}`);
    }

    if (stderr) {
      // 400 error status because of bad request (code variable is not valid)
      console.error(`stderr: ${stderr}`);
      return res.status(400).json(stderr);
    }
    console.log(stdout);
    res.send(stdout);
  });
});

module.exports = router;
