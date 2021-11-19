
exports.up = function(knex) {
  return knex.schema
     .createTable('user', t => {
        t.string('id_user').notNullable()
        t.string('name', 255).notNullable()
     })
}

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user')
}
