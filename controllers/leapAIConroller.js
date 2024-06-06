// import { Leap } from '@leap-ai/sdk';
// const { Leap } = require('@leap-ai/sdk');
const { Leap } = require('@leap-ai/workflows');
const AppError = require('../utils/appError');

class LeapAI {
  constructor(apiKey) {
    this.leapai = new Leap({ apiKey });
  }

  async generateNews({ message }) {
    try {
      const response = await this.leapai.workflowRuns.workflow({
        workflow_id: 'wkf_WAD7JNzwM3tysf',
        input: {
          input_message: message
        }
      });
      console.log('response', response);
      return response.data;
    } catch (error) {
      console.error('error', error);
      throw new AppError(error.message, error.status);
    }
  }

  async generateImage({
    // modelId = '37d42ae9-5f5f-4399-b60b-014d35e762a5', // Realistic Vision v4.0 - default
    newsPrompt,
    prompt,
    negativePrompt = '(deformed iris, deformed pupils, semi-realistic, CGI, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artefacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck',
    numberOfImages = 1,
    width = 512,
    height = 512,
    steps = 50
    // promptStrength = 7
    // seed = 4523184
  }) {
    try {
      const response = await this.leapai.workflowRuns.workflow({
        workflow_id: 'wkf_KXgZMMJwH6ivZo',
        input: {
          news_prompt: newsPrompt,
          width,
          height,
          // modelId,
          prompt,
          negative_prompt: negativePrompt,
          num_images_per_prompt: numberOfImages,
          num_inference_steps: steps
          // promptStrength
          // seed
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error while LEAP AI Generated Image', error.message);
      throw new AppError(error.message, error.status);
    }
  }

  async generateNewImage({ prompt }) {
    try {
      const negativePrompt =
        'deformed iris, deformed pupils, semi-realistic, CGI, 3d, render, sketch, cartoon, drawing, anime:1.4, text, close up, cropped, out of frame, worst quality, low quality, jpeg artefacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck';
      const response = await this.leapai.workflowRuns.workflow({
        workflow_id: 'wkf_b3SPVsAflxf2y3',
        input: {
          prompt,
          negativePrompt
        }
      });
      return response.data;
    } catch (error) {
      console.error(
        'Error while LEAP AI Generated Image with Workflow Generate Images with Realistic Vision 4',
        error.message
      );
      throw new AppError(`LEAP AI ${error.message}`, error.status);
    }
  }

  async checkResults(workflowRunId) {
    try {
      return await this.leapai.workflowRuns.getWorkflowRun({
        workflowRunId
      });
    } catch (error) {
      console.error('Error while LEAP AI Checked Image', error);
      throw new AppError(error.message, error.status);
    }
  }
}

if (!process.env.LEAP_API_WORKFLOW_KEY) {
  throw new Error('Missing env var: LEAP_API_KEY');
}

// const leapai = new LeapAI(process.env.LEAP_API_KEY);
const leapai = new LeapAI(process.env.LEAP_API_WORKFLOW_KEY);

// Set the current model to Stable Diffusion 1.5 -- default
// leapai.usePublicModel('sd-2.1');

module.exports = leapai;
