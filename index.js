const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./models/person')

app.use(express.static('build'))
app.use(bodyParser.json())
morgan.token('data', (req, res) => {
  return JSON.stringify(req.body)
})
app.use(morgan(':method :url :data :status :res[content-length] - :response-time ms'))
app.use(cors())

app.get('/info', (req, res) => {
  Person.collection.stats()
    .then(stat => {
      res.send(`<p>puhelinluettelossa ${stat.count} henkilön tiedot</p>
                <p>${new Date()}</p>`)
    })
    .catch(error => {
      console.log(error)
      res.status(400).send('bad request')
    })
})

app.get('/api/persons', (req, res) => {
  Person
    .find({}, {__v: 0})
    .then(people => {
      res.json(people.map(Person.format))
    })
    .catch(error => {
      console.log(error)
      res.status(404).end()
    })
})

app.get('/api/persons/:id', (req, res) => {
  Person
    .findById(req.params.id)
    .then(person => {
      if (person){
        res.json(Person.format(person))
      } else {
        res.status(404).end()
      }
    })
    .catch(error => {
      console.log(error)
      res.status(400).send({error: 'malformed id'})
    })
})

app.post('/api/persons', (req, res) => {
  const body = req.body

  if (body.name === undefined || body.number === undefined){
    return res.status(400).json({error: 'bad request'})
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })

  Person
    .find({name: body.name}, {__v: 0}).limit(1)
    .then(result => {
      console.log(result)
        if (result.length !== 0){
          return res.status(400).json({error: 'name must be unique'})
        } else {
          person
            .save()
            .then(savedPerson => {
              return Person.format(savedPerson)
            })
            .then(savedAndFormattedPerson => {
              res.json(savedAndFormattedPerson)
            })
            .catch(error => {
              console.log(error)
              res.status(404).end()
            })
        }
    })
    .catch(error => {
      console.log(error)
      return res.status(400).json({error: 'bad request'})
    })
})

app.put('/api/persons/:id', (req, res) => {
  const body = req.body

  const person = {
    name: body.name,
    number: body.number
  }

  Person
    .findByIdAndUpdate(req.params.id, person, {new: true})
    .then(updatedPerson => {
      return Person.format(person)
    })
    .then(updatedAndFormattedPerson => {
      res.json(updatedAndFormattedPerson)
    })
    .catch(error => {
      console.log(error)
      res.status(400).send({error: 'malformed id'})
    })
})

const checkIfNameAlreadyExists = (name) => {

}

app.delete('/api/persons/:id', (req, res) => {
  Person
    .findByIdAndRemove(req.params.id)
    .then(result => {
      res.status(204).end()
    })
    .catch(error => {
      res.status(400).send({error: 'malformed id'})
    })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
