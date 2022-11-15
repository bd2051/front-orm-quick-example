import {EntityManager} from "front-orm";
import {watch} from "watch-object";

const exampleData = {
  Author: {
    1: {
      id: 1,
      name: 'John Doe',
      age: 30,
      books: [
        1, 3
      ]
    },
    2: {
      id: 2,
      name: 'Jane Doe',
      age: 29,
      books: [
        2
      ]
    }
  },
  Book: {
    1: {
      id: 1,
      name: 'Excellent book',
      author: 1
    },
    2: {
      id: 2,
      name: 'Good book',
      author: 2
    },
    3: {
      id: 3,
      name: 'Boring book',
      author: 1
    },
  }
}
const exampleId = {
  Author: 3,
  Book: 4
}

const em = new EntityManager((data) => {
  if (!Array.isArray(data)) {
    watch(data, 'name', (newVal, oldVal) => {
      console.log('obj name set', newVal, ' oldVal:', oldVal)
    })
  }
  return data
})

const PrimaryKey = em.defaultClasses.fields.PrimaryKey
const StringField = em.defaultClasses.fields.StringField
const NumberField = em.defaultClasses.fields.NumberField
const CollectionField = em.defaultClasses.fields.CollectionField
const EntityField = em.defaultClasses.fields.EntityField

const Collection = em.defaultClasses.types.Collection
const Entity = em.defaultClasses.types.Entity

function Author(em) {
  return {
      id: new PrimaryKey(em),
      name: new StringField(em),
      age: new NumberField(em),
      books: new CollectionField(em, 'Book')
  };
}

function Book(em) {
    return {
        id: new PrimaryKey(em),
        name: new StringField(em),
        author: new EntityField(em, Author.name),
    };
}

em.setModel(Author, {
  find: new Entity(em, (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(exampleData['Author'][id])
      }, 500)
    })
  }),
  findByAge: new Collection(em, (age) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Object.values(exampleData['Author']).filter(el => el.age === age))
      }, 700)
    })
  })
})

em.setModel(Book, {
  findAll: new Collection(em, () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Object.values(exampleData['Book']))
      }, 400)
    })
  })
})

em.setHooks({
  preFlush(commits) {
    console.log('commits', commits)
    return commits
  },
  get(data, pk) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(exampleData[data.$getName()][pk])
      }, 500)
    })
  },
  create(data, value) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = exampleId[data.$getName()]++
        if (value.author) {
          value.author = value.author.id
        }
        if (value.books) {
          value.books = value.books.map((el) => el.id)
        }
        exampleData[data.$getName()][newId] = {
          id: newId,
          ...value
        }
        resolve(newId)
      }, 500)
    })
  },
  update(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        exampleData[data.$getName()][data.id] = {...data}
        resolve(data.id)
      }, 500)
    })
  },
  delete(data, pk) {
    return new Promise((resolve) => {
      setTimeout(() => {
        delete exampleData[data.$getName()][pk]
        resolve(pk)
      }, 500)
    })
  },
})

console.log(em)

console.log('start first example')
em.repositories.Author.find(1).then((author) => {
  const firstAuthorBook = author.books[0]
  const firstAuthorBookName = firstAuthorBook.name
  console.log('Before request firstAuthorBookName = ', firstAuthorBookName)
})

let books = null

setTimeout(() => {
  console.log('start second example')
  em.repositories.Book.findAll().then((bookCollection) => {
    books = bookCollection
    const authorName = bookCollection[0].author.name
    console.log('entity manager use request from first example')
    console.log('authorName = ', authorName)

    const secondAuthorName = bookCollection[1].author.name
    console.log('Before request secondAuthorName = ', secondAuthorName)
  })
}, 1500)

setTimeout(() => {
  console.log('start third example')
  const secondAuthor = books[1].author
  const newBook = em.post({
    name: 'New book',
    author: secondAuthor
  }, em.models.Book)
  console.log('new book name:', newBook.name)
  console.log('new book author:', newBook.author.name)
  em.flush()
  setTimeout(() => {
    console.log('server data set', exampleData['Book'][newBook.id])
  }, 600)
}, 3000)
