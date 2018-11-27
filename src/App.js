import React from 'react'
import personService from './services/persons'

const Notification = ({message, error}) => {
  if (message === null){
    return null;
  }

  if (error){
    return (
      <div className="error">
        {message}
      </div>
    )
  }

  return (
    <div className="notification">
      {message}
    </div>
  )
}

class AddNewForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      newName: '',
      newNumber: '',
    }

    this.handleNameChange = this.handleNameChange.bind(this)
    this.handleNumberChange = this.handleNumberChange.bind(this)
    this.addName = this.addName.bind(this)
  }

  addName = (event) => {
    event.preventDefault()
    let personsArray = []
    personsArray = this.props.state.persons
    const personObject = {
      name: this.state.newName,
      number: this.state.newNumber
    }

    if (this.props.state.persons.filter(person =>
      person.name.toLowerCase() === this.state.newName.toLowerCase()).length === 0){
        personService
          .create(personObject)
          .then(response => {
            personsArray = this.props.state.persons.concat(response.data)
            const message = `lisättiin ${personObject.name}`
            this.props.formFunction(personsArray, message)
            this.setState({newName: '', newNumber: ''})
          })
          .catch(error => {
            const message = `osoitteen ${personObject.name} luomisessa
            tapahtui virhe`
            this.props.errorFunc(message)
      })
    } else {
      const result = window.confirm(`${this.state.newName} on jo luettelossa,
        korvataanko vanha numero uudella?`)

      if (result) {
        const address = this.props.state.persons.find(person =>
          person.name.toLowerCase() === this.state.newName.toLowerCase())
        const changedAddress = {...address, number: this.state.newNumber}

        personService
          .update(address.id, changedAddress)
          .then(response => {
            const changedArray = this.props.state.persons.map(person =>
              person.id !== address.id ? person : changedAddress)
            const message = `muokattiin ${changedAddress.name}`
            this.props.formFunction(changedArray, message)
            this.setState({newName: '', newNumber: ''})
          })
          .catch(error => {
            const message = `osoitetta ${changedAddress.name} ei löytynyt
                              palvelimelta, luodaan uusi`
            personService
              .create(changedAddress)
              .then(response => {
                personsArray = this.props.state.persons.filter((person) =>
                person.name.toLowerCase() !== changedAddress.name.toLowerCase())

                personsArray = personsArray.concat(response.data)
                this.props.formFunction(personsArray, message)
                this.setState({newName: '', newNumber: ''})
              })
              .catch(error => {
                const message = `osoitteen ${personObject.name} luomisessa
                tapahtui virhe`
                this.props.errorFunc(message)
              })
          })
      }
    }
  }

  handleNameChange = (event) => {
    this.setState({ newName: event.target.value })
  }

  handleNumberChange = (event) => {
    this.setState({ newNumber: event.target.value })
  }

  render () {
    return (
      <form onSubmit={this.addName}>
        <h2>Lisää uusi / muuta olemassaolevan numeroa</h2>
        <div>
          nimi: <input value={this.state.newName}
                        onChange={this.handleNameChange} />
        </div>
        <div>
          numero: <input value={this.state.newNumber}
                          onChange={this.handleNumberChange} />
        </div>
        <div>
          <button type="submit">lisää</button>
        </div>
      </form>
    )
  }
}

const Address = (props) => {
  return (
    <tr>
      <td>{props.name}</td>
      <td>{props.number}</td>
      <td>
        <button onClick={props.removeFunction}>
          poista
        </button>
      </td>
    </tr>
  )
}

const AddressList = (props) => {
  const removeFunc = (id, name) => {
    return () => {
      const result = window.confirm(`poistetaanko ${name}`)
      if (result){
        personService
          .deleteEntry(id)
          .then(response => {
            personService
              .getAll()
              .then(response => {
                const message = `poistettiin ${name}`
                props.update(response.data, message)
            })
            .catch(error => {
              const message = `palvelimeen ei saada yhteyttä`
              props.errorFunc(message)
            })
        })
        .catch(error => {
          const message = `osoitetta ${name} ei löytynyt palvelimelta`
          props.errorFunc(message)
        })
      }
    }
  }

  return (
    <div>
      <h2>Numerot</h2>
      <table>
        <tbody>
        {props.addresses.map(person => <Address key={person.name}
          name={person.name} number={person.number}
          removeFunction={removeFunc(person.id, person.name)}/>)}
        </tbody>
      </table>
    </div>
  )
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      persons: [],
      filter: '',
      notification: null,
      error: false
    }

    this.handlePersonsChange = this.handlePersonsChange.bind(this)
  }

  handleFilterChange = (event) => {
    this.setState({ filter: event.target.value })
  }

  handlePersonsChange = (value, message) => {
    this.setState({persons: value, notification: message})
    setTimeout(() => {
      this.setState({notification: null})
    }, 5000)
  }

  handlePersonRemoval = (value, message) => {
    this.setState({persons: value, notification: message})
    setTimeout(() => {
      this.setState({notification: null})
    }, 5000)
  }

  displayError = (message) => {
    this.setState({notification: message, error: true})
    setTimeout(() => {
      this.setState({notification: null, error: false})
    }, 5000)
  }

  componentDidMount() {
    personService
      .getAll()
      .then(response => {
        const persons = response.data
        this.setState({ persons: persons })
      })
  }

  render() {
    const addressesToShow = this.state.persons.filter(person =>
          person.name.toLowerCase().includes(this.state.filter.toLowerCase()))

    return (
      <div>
        <div>
          <h2>Puhelinluettelo</h2>
          <Notification message={this.state.notification}
                        error={this.state.error}/>
        </div>
        <div>
          rajaa näytettäviä: <input value={this.state.filter}
                                    onChange={this.handleFilterChange} />
        </div>
        <AddNewForm state={this.state} formFunction={this.handlePersonsChange}
                    errorFunc={this.displayError}/>
        <AddressList addresses={addressesToShow} state={this.state}
          update={this.handlePersonRemoval} errorFunc={this.displayError}/>
      </div>
    )
  }
}

export default App
