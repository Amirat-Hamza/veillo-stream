import { useState, useEffect } from 'react';

export const useApiModels = (provider: string, apiKey: string) => {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const detectModels = async () => {
      if (!apiKey.trim()) {
        setModels([]);
        return;
      }

      setLoading(true);
      try {
        let availableModels: string[] = [];
        
        switch (provider) {
          case 'openai':
            try {
              const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                availableModels = data.data
                  .filter((model: any) => model.id.includes('gpt'))
                  .map((model: any) => model.id)
                  .sort();
              } else {
                availableModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
              }
            } catch {
              availableModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
            }
            break;

          case 'gemini':
            availableModels = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-pro-vision'];
            break;

          case 'deepseek':
            availableModels = ['deepseek-chat', 'deepseek-coder', 'deepseek-v2-chat'];
            break;

          case 'claude':
            availableModels = [
              'claude-3-5-sonnet-20241022', 
              'claude-3-opus-20240229', 
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307'
            ];
            break;

          case 'huggingface':
            availableModels = [
              'meta-llama/Meta-Llama-3.1-8B-Instruct',
              'microsoft/DialoGPT-medium',
              'mistralai/Mistral-7B-Instruct-v0.1',
              'google/flan-t5-large',
              'facebook/blenderbot-400M-distill'
            ];
            break;

          case 'openrouter':
            availableModels = [
              'anthropic/claude-3.5-sonnet',
              'openai/gpt-4o',
              'openai/gpt-4o-mini',
              'google/gemini-pro-1.5',
              'meta-llama/llama-3.1-8b-instruct',
              'mistralai/mistral-7b-instruct',
              'cohere/command-r-plus'
            ];
            break;
        }

        setModels(availableModels);
      } catch (error) {
        console.error('Error detecting models:', error);
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    detectModels();
  }, [provider, apiKey]);

  return { models, loading };
};