export const BID_ERRORS = {
  NOT_LOGGED_IN: "Você precisa estar logado para fazer um lance",
  AUCTION_NOT_STARTED: "O leilão ainda não começou. Aguarde a abertura oficial.",
  AUCTION_CLOSED: "Este leilão já foi encerrado.",
  LOW_BID: (minAmount: string) => `O lance deve ser de pelo menos ${minAmount}`,
  DEPOSIT_REQUIRED: "Sua caução precisa estar aprovada para participar deste leilão.",
  PROCESS_ERROR: "Erro ao processar lance. Tente novamente.",
  RACE_CONDITION: "Um lance maior já foi registrado. O valor foi atualizado.",
  GENERIC_ERROR: "Ocorreu um erro inesperado. Por favor, tente novamente."
};
