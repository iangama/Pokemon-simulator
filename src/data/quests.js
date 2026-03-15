export const WORLD_NPCS = {
  oakwindTown: [
    {
      id: 'cedar',
      name: 'Professor Cedar',
      x: 6,
      y: 6,
      dialogue: [
        'Treinador, leve este pacote para o balconista da loja.',
        'Isso vai liberar itens especiais para sua jornada.',
      ],
      questId: 'oakwindParcel',
    },
  ],
  itemShop: [
    {
      id: 'shop-clerk',
      name: 'Shop Clerk',
      x: 3,
      y: 3,
      dialogue: ['Ah, esse pacote e do Professor Cedar. Obrigado!'],
      questTrigger: 'oakwindParcel-delivery',
    },
  ],
  sunleafForest: [
    {
      id: 'forest-ranger',
      name: 'Ranger Lio',
      x: 9,
      y: 6,
      dialogue: [
        'A floresta esta perigosa. Derrote a Scout Mia e volte aqui.',
        'Assim voce prova que consegue seguir para a Route 2.',
      ],
      questId: 'forestChallenge',
    },
  ],
};

export const QUESTS = {
  oakwindParcel: {
    id: 'oakwindParcel',
    name: 'Entrega em Oakwind',
    description: 'Leve o pacote do Professor Cedar para o balconista da loja.',
    kind: 'interact',
    triggerId: 'oakwindParcel-delivery',
    rewards: { money: 500, items: { pokeball: 5, potion: 2 } },
  },
  forestChallenge: {
    id: 'forestChallenge',
    name: 'Rota Segura',
    description: 'Derrote a Scout Mia em Sunleaf Forest e fale com Ranger Lio.',
    kind: 'trainer-defeat',
    trainerId: 'trainer-mia',
    rewards: { money: 700, items: { superPotion: 2 } },
  },
};
