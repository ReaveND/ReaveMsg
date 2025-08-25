import nock from "nock";
import myProbotApp from "../index.js";
import { Probot, ProbotOctokit } from "probot";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, beforeEach, afterEach, test } from "node:test";
import assert from "node:assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8"
);

// Load payloads
const issueOpenedPayload = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/issues.opened.json"), "utf-8")
);
const issueClosedPayload = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/issues.closed.json"), "utf-8")
);
const prOpenedPayload = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/pull_request.opened.json"), "utf-8")
);
const prClosedPayload = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures/pull_request.closed.json"), "utf-8")
);

describe("My Probot app", () => {
  let probot;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    probot.load(myProbotApp);
  });

  test("creates a comment when an issue is opened", async () => {
    const { repository, issue } = issueOpenedPayload;

    const mock = nock("https://api.github.com")
      .post(`/app/installations/${issueOpenedPayload.installation.id}/access_tokens`)
      .reply(200, { token: "test", permissions: { issues: "write" } })
      .post(`/repos/${repository.owner.login}/${repository.name}/issues/${issue.number}/comments`, (body) => {
        assert.deepEqual(body, {
          body: `👋 Hi @${issue.user.login}, thanks for opening this issue!  \nWe'll take a look soon. Feel free to add more context if needed.`,
        });
        return true;
      })
      .reply(200);

    await probot.receive({ name: "issues", payload: issueOpenedPayload });
    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("creates a comment when an issue is closed", async () => {
    const { repository, issue } = issueClosedPayload;

    const mock = nock("https://api.github.com")
      .post(`/app/installations/${issueClosedPayload.installation.id}/access_tokens`)
      .reply(200, { token: "test", permissions: { issues: "write" } })
      .post(`/repos/${repository.owner.login}/${repository.name}/issues/${issue.number}/comments`, (body) => {
        assert.deepEqual(body, {
          body: `🔒 This issue has been closed. Thanks @${issue.user.login} for reporting it!`,
        });
        return true;
      })
      .reply(200);

    await probot.receive({ name: "issues", payload: issueClosedPayload });
    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("creates a comment when a PR is opened", async () => {
    const { repository, pull_request } = prOpenedPayload;

    const mock = nock("https://api.github.com")
      .post(`/app/installations/${prOpenedPayload.installation.id}/access_tokens`)
      .reply(200, { token: "test", permissions: { issues: "write" } })
      .post(`/repos/${repository.owner.login}/${repository.name}/issues/${pull_request.number}/comments`, (body) => {
        assert.deepEqual(body, {
          body: `👋 Hey @${pull_request.user.login}, thanks for opening this PR!  \nWe'll review it soon. Meanwhile, check out our contribution guide.`,
        });
        return true;
      })
      .reply(200);

    await probot.receive({ name: "pull_request", payload: prOpenedPayload });
    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  test("creates a comment when a PR is closed and merged", async () => {
    const { repository, pull_request } = prClosedPayload;

    const mock = nock("https://api.github.com")
      .post(`/app/installations/${prClosedPayload.installation.id}/access_tokens`)
      .reply(200, { token: "test", permissions: { issues: "write" } })
      .post(`/repos/${repository.owner.login}/${repository.name}/issues/${pull_request.number}/comments`, (body) => {
        assert.deepEqual(body, {
          body: `✅ Congrats @${pull_request.user.login}, your PR was merged! Thanks for contributing.`,
        });
        return true;
      })
      .reply(200);

    await probot.receive({ name: "pull_request", payload: prClosedPayload });
    assert.deepStrictEqual(mock.pendingMocks(), []);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
