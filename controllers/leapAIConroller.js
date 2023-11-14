// import { Leap } from '@leap-ai/sdk';
const { Leap } = require('@leap-ai/sdk');

class LeapAI {
  constructor(apiKey) {
    this.openai = new Leap(apiKey);
  }

  //   async chat(messages) {
  //     console.log('messages', messages);
  //     try {
  //       const response = await this.openai.createChatCompletion({
  //         model: 'gpt-3.5-turbo',
  //         messages
  //       });
  //       return response.data.choices[0].message;
  //     } catch (error) {
  //       console.log('Error while gpt chat', error.message);
  //     }
  // }
}

if (!process.env.LEAP_API_KEY) {
  throw new Error('Missing env var: LEAP_API_KEY');
}

const leapai = new Leap(process.env.LEAP_API_KEY);

// Set the current model to Stable Diffusion 1.5 -- default
// leapai.usePublicModel('sd-2.1');

module.exports = leapai;
