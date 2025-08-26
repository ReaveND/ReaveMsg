export default (app) => {
  app.log.info("🚀 ReaveMsg is live and ready to handle events!");
  // 🔔 Pull Request Opened
  app.on('pull_request.opened', async (context) => {
  context.log.info("✅ pull_request.opened event received");

  app.get('/ping', async (req, res) => {
  res.send('✅ Ping received');
  });


  const pr = context.payload.pull_request;
  const repo = context.payload.repository;

  const message = `👋 Hey @${pr.user.login}, thanks for opening this PR! @ReaveND will review it soon!`;

  try {
    await context.octokit.issues.createComment({
      owner: repo.owner.login,
      repo: repo.name,
      issue_number: pr.number,
      body: message
    });
    context.log.info("✅ Comment posted successfully");
  } catch (error) {
    context.log.error("❌ Failed to post comment:", error);
  }
});

  // 🧹 Pull Request Closed
  app.on("pull_request.closed", async (context) => {
    const { pull_request, repository } = context.payload;
    const prAuthor = pull_request.user.login;
    const prNumber = pull_request.number;
    const wasMerged = pull_request.merged;

    const message = wasMerged
      ? `✅ Congrats @${prAuthor}, your PR was merged by @ReaveND! Thanks for contributing.`
      : `❌ Hey @${prAuthor}, your PR was closed without merging. Let us know if you need help.`;

    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: prNumber,
      body: message,
    });
  });

  // 📝 Issue Opened
  app.on("issues.opened", async (context) => {
    const { issue, repository } = context.payload;
    const issueAuthor = issue.user.login;
    const issueNumber = issue.number;

    const message = `👋 Hi @${issueAuthor}, thanks for opening this issue!  
We'll take a look soon. Feel free to add more context if needed.`;

    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issueNumber,
      body: message,
    });
  });

  // 🗃️ Issue Closed
  app.on("issues.closed", async (context) => {
    const { issue, repository } = context.payload;
    const issueAuthor = issue.user.login;
    const issueNumber = issue.number;

    const message = `🔒 This issue has been closed. Thanks @${issueAuthor} for reporting it!`;

    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issueNumber,
      body: message,
    });
  });
};
