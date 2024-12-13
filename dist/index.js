/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 343:
/***/ ((module) => {

function getShieldURL(url) {
  return `https://img.shields.io/endpoint?url=${url}`;
}

function getJSONBadge(pct, thresholdGreen = 100, thresholdOrange = 70) {
  let color = "red";
  if (pct >= thresholdGreen) {
    color = "brightgreen";
  } else if (pct >= thresholdOrange) {
    color = "orange";
  }

  return {
    schemaVersion: 1,
    label: "Coverage",
    message: `${pct}%`,
    color,
  };
}

module.exports = { getShieldURL, getJSONBadge };


/***/ }),

/***/ 374:
/***/ ((module) => {

function isBranch() {
  return process.env.GITHUB_REF.startsWith("refs/heads/");
}

async function isMainBranch(octokit, owner, repo) {
  let response = await octokit.rest.repos.get({
    owner,
    repo,
  });
  return response.data.default_branch === process.env.GITHUB_REF_NAME;
}

module.exports = { isBranch, isMainBranch };


/***/ }),

/***/ 73:
/***/ ((module) => {

const MARKER = "<!-- This comment was produced by coverage-diff-action -->";

async function addComment(octokit, repo, issue_number, body) {
  return await octokit.rest.issues.createComment({
    ...repo,
    issue_number,
    body: `${body}
${MARKER}`,
  });
}

async function deleteExistingComments(octokit, repo, issue_number) {
  let comments = await octokit.rest.issues.listComments({
    ...repo,
    issue_number,
  });

  for (const comment of comments.data) {
    if (comment.body.includes(MARKER)) {
      await octokit.rest.issues.deleteComment({
        ...repo,
        comment_id: comment.id,
      });
    }
  }
}

module.exports = { addComment, deleteExistingComments };


/***/ }),

/***/ 589:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const coverageDiff = __nccwpck_require__(14);

const ICONS = {
  OK: "✅",
  WARN: "⚠️",
  KO: "🔴",
};

const CRITERIAS = ["lines", "branches", "functions", "statements"];

function _renderPct(pct, addSign = true) {
  if (!pct.toFixed) { return pct }
  
  if (addSign && pct >= 0) {
    return `+${pct.toFixed(2)}%`;
  }
  return `${pct.toFixed(2)}%`;
}

function computeDiff(base, head, options = {}) {
  const diff = coverageDiff.diff(base, head);

  let totalTitle = "Total coverage";
  let summaryTitle = "click to open the diff coverage report";

  let countRegression = 0;
  let table = [];
  Object.keys(diff.diff).forEach((file) => {
    if (file === "total") {
      return;
    }

    const element = diff.diff[file];

    if (CRITERIAS.every((criteria) => element[criteria].pct === 0)) {
      return;
    }

    const fileRegression = CRITERIAS.some(
      (criteria) => element[criteria].pct < 0
    );
    if (fileRegression) {
      countRegression++;
    }

    table.push({
      icon: fileRegression ? ICONS.KO : ICONS.OK,
      filename: file,
      lines: {
        pct: _renderPct(head[file].lines.pct, false),
        diff: _renderPct(element.lines.pct),
      },
      branches: {
        pct: _renderPct(head[file].branches.pct, false),
        diff: _renderPct(element.branches.pct),
      },
      functions: {
        pct: _renderPct(head[file].functions.pct, false),
        diff: _renderPct(element.functions.pct),
      },
      statements: {
        pct: _renderPct(head[file].statements.pct, false),
        diff: _renderPct(element.statements.pct),
      },
    });
  });

  if (table.length > 0 && countRegression > 0) {
    summaryTitle = `${countRegression} file${
      countRegression > 1 ? "s" : ""
    } with a coverage regression`;
  }

  let totals = {};
  let globalRegression = false;
  CRITERIAS.forEach((criteria) => {
    let diffPct = head.total[criteria].pct - base.total[criteria].pct;
    if (diffPct < 0) {
      globalRegression = true;
    }
    totals[criteria] = `${_renderPct(
      head.total[criteria].pct,
      false
    )} (${_renderPct(diffPct)})`;
  });

  if (globalRegression) {
    totalTitle = `${
      options.allowedToFail ? ICONS.WARN : ICONS.KO
    } Total coverage is lower than the default branch`;
  }

  return {
    regression: globalRegression,
    markdown: `
### ${totalTitle}

| Lines           | Branches           | Functions           | Statements           |
| --------------- | ------------------ | ------------------- | -------------------- |
| ${totals.lines} | ${totals.branches} | ${totals.functions} | ${
      totals.statements
    } | 
${
  table.length > 0
    ? `

#### Detailed report

<details><summary>${summaryTitle}</summary>

|   | File | Lines | Branches | Functions | Statements |
| - | ---- | ----- | -------- | --------- | ---------- |${table.map(
        (row) =>
          `\n| ${row.icon} | ${row.filename} | ${row.lines.pct}${
            row.lines.diff !== "+0.00%" ? ` (${row.lines.diff})` : ""
          } | ${row.branches.pct}${
            row.branches.diff !== "+0.00%" ? ` (${row.branches.diff})` : ""
          } | ${row.functions.pct}${
            row.functions.diff !== "+0.00%" ? ` (${row.functions.diff})` : ""
          } | ${row.statements.pct}${
            row.statements.diff !== "+0.00%" ? ` (${row.statements.diff})` : ""
          } |`
      )}
</details>`
    : ""
}
`,
  };
}

module.exports = { computeDiff };


/***/ }),

/***/ 280:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const simpleGit = __nccwpck_require__(577);

async function gitClone(url, wikiPath) {
  return await simpleGit().clone(url, wikiPath);
}

async function gitUpdate(wikiPath) {
  return await simpleGit(wikiPath)
    .addConfig("user.name", "Coverage Diff Action")
    .addConfig("user.email", "coverage-diff-action")
    .add("*")
    .commit("Update coverage badge")
    .push();
}

module.exports = { gitClone, gitUpdate };


/***/ }),

/***/ 796:
/***/ ((module) => {

function average(arr, fixed = 2) {
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(fixed);
}

module.exports = { average };


/***/ }),

/***/ 337:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 433:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 14:
/***/ ((module) => {

module.exports = eval("require")("coverage-diff");


/***/ }),

/***/ 577:
/***/ ((module) => {

module.exports = eval("require")("simple-git");


/***/ }),

/***/ 896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 943:
/***/ ((module) => {

"use strict";
module.exports = require("fs/promises");

/***/ }),

/***/ 928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const {
  readFile,
  writeFile,
  copyFile,
  mkdir,
  mkdtemp,
} = __nccwpck_require__(943);
const { existsSync } = __nccwpck_require__(896);
const path = __nccwpck_require__(928);
const core = __nccwpck_require__(337);
const github = __nccwpck_require__(433);

const { gitClone, gitUpdate } = __nccwpck_require__(280);
const { isBranch, isMainBranch } = __nccwpck_require__(374);
const { getShieldURL, getJSONBadge } = __nccwpck_require__(343);
const { average } = __nccwpck_require__(796);
const { computeDiff } = __nccwpck_require__(589);
const { addComment, deleteExistingComments } = __nccwpck_require__(73);

const { context } = github;

async function run() {
  const tmpPath = await mkdir(path.join(process.env.GITHUB_WORKSPACE, "tmp"), {
    recursive: true,
  });
  const WIKI_PATH = await mkdtemp(path.join(tmpPath, "coverage-diff-"));

  const githubToken = core.getInput("github-token");
  const baseSummaryFilename = core.getInput("base-summary-filename");
  const coverageFilename = core.getInput("coverage-filename");
  const badgeThresholdOrange = core.getInput("badge-threshold-orange");

  core.info(`Cloning wiki repository...`);

  await gitClone(
    `https://x-access-token:${githubToken}@github.com/${process.env.GITHUB_REPOSITORY}.wiki.git`,
    WIKI_PATH
  );

  const octokit = github.getOctokit(githubToken);

  const head = JSON.parse(await readFile(coverageFilename, "utf8"));

  const pct = average(
    Object.keys(head.total).map((t) => head.total[t].pct),
    0
  );

  if (
    isBranch() &&
    (await isMainBranch(octokit, context.repo.owner, context.repo.repo))
  ) {
    core.info("Running on default branch");
    const BadgeEnabled = core.getBooleanInput("badge-enabled");
    const badgeFilename = core.getInput("badge-filename");

    core.info("Saving json-summary report into the repo wiki");
    await copyFile(coverageFilename, path.join(WIKI_PATH, baseSummaryFilename));

    if (BadgeEnabled) {
      core.info("Saving Badge into the repo wiki");

      const badgeThresholdGreen = core.getInput("badge-threshold-green");

      await writeFile(
        path.join(WIKI_PATH, badgeFilename),
        JSON.stringify(
          getJSONBadge(pct, badgeThresholdGreen, badgeThresholdOrange)
        )
      );
    }

    await gitUpdate(WIKI_PATH);

    if (BadgeEnabled) {
      const url = `https://raw.githubusercontent.com/wiki/${process.env.GITHUB_REPOSITORY}/${badgeFilename}`;
      core.info(`Badge JSON stored at ${url}`);
      core.info(`Badge URL: ${getShieldURL(url)}`);
    }
  } else {
    core.info("Running on pull request branch");
    if (!existsSync(path.join(WIKI_PATH, baseSummaryFilename))) {
      core.info("No base json-summary found");
      return;
    }

    const issue_number = context?.payload?.pull_request?.number;
    const allowedToFail = core.getBooleanInput("allowed-to-fail");
    const base = JSON.parse(
      await readFile(path.join(WIKI_PATH, baseSummaryFilename), "utf8")
    );

    const diff = computeDiff(base, head, { allowedToFail });

    if (issue_number) {
      await deleteExistingComments(octokit, context.repo, issue_number);

      core.info("Add a comment with the diff coverage report");
      await addComment(octokit, context.repo, issue_number, diff.markdown);
    } else {
      core.info(diff.results);
    }

    if (!allowedToFail && diff.regression) {
      throw new Error("Total coverage is lower than the default branch");
    }
  }
}

try {
  run();
} catch (error) {
  core.setFailed(error.message);
}

module.exports = __webpack_exports__;
/******/ })()
;