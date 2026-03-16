// Neural Hub config and module models
export interface NeuralHubConfig {
  enabled: boolean;
  liveDataEnabled: boolean;
  modelId: string;
  hfToken: string;
  endpoints: Record<string, string>;
}

export interface NeuralModule {
  id: string;
  name: string;
  purpose: string;
  dataSource: 'live' | 'history' | 'simulation';
  updateInterval: number;
  enabled: boolean;
}

