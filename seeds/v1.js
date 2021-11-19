exports.seed = function(knex) {
  return knex('user').del()
    .then(() => {
      return knex('user').insert([
        { id_user: '1', name: 'John' },
        { id_user: '2', name: 'Mary' },
        { id_user: '3', name: 'Mike' },
        { id_user: '4', name: 'Frank' },
        { id_user: '5', name: 'Stephanie' },
        { id_user: '6', name: 'Richard' },
        { id_user: '7', name: 'Sonia' },
        { id_user: '8', name: 'Charlie' },
        { id_user: '9', name: 'Rowan' },
        { id_user: '10', name: 'Victoria' }
      ])
    })
}
