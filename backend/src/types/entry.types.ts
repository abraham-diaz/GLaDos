export interface CreateEntryRequest {
  raw_text: string;
}

export interface CreateEntryResponse {
  id: string;
  status: 'created';
}
