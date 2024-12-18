import { Entity, MikroORM, OneToOne, PrimaryKey, Property, Ref } from '@mikro-orm/sqlite';


@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToOne({
    entity: () => UserVirtual,
    ref: true,
    formula: alias => `select id as virtual_user_id, name from users where users.id = ${alias}.id`,
  })
  virtualUser?: Ref<UserVirtual>;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

@Entity({ expression: 'select id as virtual_user_id, name from users'})
class UserVirtual {
	@Property()
	name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  orm.em.create(User, { name: 'Foo', email: 'foo' });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: 'foo' });
  expect(user.name).toBe('Foo');
  user.name = 'Bar';
  orm.em.remove(user);
  await orm.em.flush();

  const count = await orm.em.count(User, { email: 'foo' });
  expect(count).toBe(0);
});
