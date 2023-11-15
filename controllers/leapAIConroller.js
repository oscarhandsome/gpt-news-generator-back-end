// import { Leap } from '@leap-ai/sdk';
const { Leap } = require('@leap-ai/sdk');

class LeapAI {
  constructor(apiKey) {
    this.leapai = new Leap(apiKey);
  }

  async generateImage({
    modelId = '37d42ae9-5f5f-4399-b60b-014d35e762a5', // Realistic Vision v4.0 - default
    prompt,
    negativePrompt = '(deformed iris, deformed pupils, semi-realistic, CGI, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artefacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck',
    numberOfImages = 1,
    width = 512,
    height = 512,
    steps = 50,
    promptStrength = 7
    // seed = 4523184
  }) {
    try {
      return await this.leapai.generate.generateImage({
        modelId,
        prompt,
        negativePrompt,
        numberOfImages,
        width,
        height,
        steps,
        promptStrength
        // seed
      });
    } catch (error) {
      console.log('Error while leap ai generateImage', error.message);
      return error;
    }
  }
}

if (!process.env.LEAP_API_KEY) {
  throw new Error('Missing env var: LEAP_API_KEY');
}

const leapai = new LeapAI(process.env.LEAP_API_KEY);

// Set the current model to Stable Diffusion 1.5 -- default
// leapai.usePublicModel('sd-2.1');

module.exports = leapai;
