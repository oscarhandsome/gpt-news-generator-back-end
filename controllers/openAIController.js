const { Configuration, OpenAIApi } = require('openai');
// const config = require('config');
// import { createReadStream } from 'fs';

class OpenAI {
  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system'
  };

  constructor(apiKey) {
    const configuration = new Configuration({
      // organization: 'org-ZuzWlL9kYtY3oiRhY9pqm0Li',
      // apiKey: process.env.OPENAI_API_KEY,
      apiKey
    });
    this.openai = new OpenAIApi(configuration);
  }

  async chat(messages) {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages
      });
      return response.data.choices[0].message;
    } catch (error) {
      console.error('Error while OpenAIApi', error.message);
    }
  }

  // async transcription(filepath) {
  //   try {
  //     const response = await this.openai.createTranscription(
  //       createReadStream(filepath),
  //       'whisper-1'
  //     );
  //     return response.data.text;
  //   } catch (error) {
  //     console.log('Error while gpt transcription', error.message);
  //   }
  // }
}

const openai = new OpenAI(process.env.OPENAI_API_KEY);

module.exports = openai;
