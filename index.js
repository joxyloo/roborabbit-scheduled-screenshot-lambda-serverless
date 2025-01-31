const API_KEY = 'your_api_key';
const TASK_UID = 'your_task_id';
const TAKE_SCREENSHOT_STEP_ID = {
  DESKTOP: 'step_2_id',
  TABLET: 'step_4_id',
  MOBILE: 'step_6_id',
};
module.exports.run = async (event, context) => {
  const screenshotUrls = await triggerScreenshot();

  console.log(screenshotUrls);

  // do other things with the screenshot URLs, eg. uploading to a server, use it for other tasks, etc.

  return {
    status: 200,
  };
};

// for webhook
module.exports.onScreenshotDone = async (event, context) => {
  const body = JSON.parse(event.body);
  const screenshotUrls = {
    desktop: body.outputs[`${TAKE_SCREENSHOT_STEP_ID.DESKTOP}_take_screenshot`],
    tablet: body.outputs[`${TAKE_SCREENSHOT_STEP_ID.TABLET}_take_screenshot`],
    mobile: body.outputs[`${TAKE_SCREENSHOT_STEP_ID.MOBILE}_take_screenshot`],
  };

  console.log(screenshotUrls);

  // do other things with the screenshot URLs, eg. uploading to a server, use it for other tasks, etc.

  return {
    statusCode: 200,
  };
};

async function triggerScreenshot() {
  return new Promise(async (resolve) => {
    const screenshotTask = await takeScreenshot();

    if (screenshotTask.status === 'running' && screenshotTask.uid) {
      console.log(`Task ${screenshotTask.uid} is running... Poll API to get the result`);

      const polling = setInterval(async () => {
        const screenshotResult = await getScreenshotResult(TASK_UID, screenshotTask.uid);

        if (screenshotResult.status === 'running') {
          console.log('Still running.....');
        } else if (screenshotResult.status === 'finished') {
          const screenshotUrls = {
            desktop: screenshotResult.outputs[`${TAKE_SCREENSHOT_STEP_ID.DESKTOP}_take_screenshot`],
            tablet: screenshotResult.outputs[`${TAKE_SCREENSHOT_STEP_ID.TABLET}_take_screenshot`],
            mobile: screenshotResult.outputs[`${TAKE_SCREENSHOT_STEP_ID.MOBILE}_take_screenshot`],
          };

          clearInterval(polling);
          resolve(screenshotUrls);
        }
      }, 1000);
    }
  });
}

async function takeScreenshot() {
  const body = {
    // webhook_url: `${process.env.SCREENSHOT_HANDLER_URL}/screenshot-done`, // send the result to the webhook URL when the task has finished running, uncomment to use it
  };

  const res = await fetch(`https://api.roborabbit.com/v1/tasks/${TASK_UID}/runs`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  return await res.json();
}

async function getScreenshotResult(taskId, runId) {
  const res = await fetch(`https://api.roborabbit.com/v1/tasks/${taskId}/runs/${runId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  return await res.json();
}
