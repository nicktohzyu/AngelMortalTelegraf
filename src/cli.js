const fs = require('fs')
const {Person, Model} = require("./model");

InputHandler = (model) => async (input) => {
    const tokens = input.trim().split(" ")
    if (tokens.length === 0)
        return;
    const command = tokens[0].toLowerCase()
    const args = tokens.slice(1)
    switch (command) {
        case "load":
            model.copyPeopleFrom(await LoadCommand(args[0], false));
            console.log(model.dumpUuids())
            model.saveToStorage()
            break;
        case "loadpaired":
            model.copyPeopleFrom(await LoadCommand(args[0], true));
            console.log(model.dumpUuids())
            model.saveToStorage()
            break;
        case "list":
        case "ls":
        case "show":
            ListAll(model, ...args)
            break
        case 'dump':
            Dump(model)
            break
        case "announce":
            Announce(model)
            break
        case "d":
        case "rm":
        case "delete":
        case "deregister":
            Deregister(model, args[0])
            break
        default:
            console.log("Unknown command", command)
    }
}

async function Deregister(model, uuid) {
    const person = model.getPersonByUuid(uuid)
    if (person) {
        console.log("Deregistered", person.name, uuid, person.telegramId)
        person.deregister()
        model.saveToStorage()
    } else {
        console.log("No one with that code found")
    }
}

async function Announce(model) {
    console.log('wip command')
}

function loadPaired(content) {
    const model = new Model();
    content.split("\n").forEach(line => {
        const name = line.split(",")[0].trim()
        if (name !== "") {
            console.log(name)
            const person = new Person().withName(name)
            model.addPerson(person)
        }
    })
    model.generateUuids()

    // load data.txt true
    content.split("\n").forEach(line => {
        if (line.trim() === "") return;
        const angel = line.split(",")[0].trim()
        const mortal = line.split(",")[1].trim()
        if (angel !== "" && mortal !== "") {
            console.log(`${angel}-${mortal}`)
            const a = model.getPersonByName(angel)
            const m = model.getPersonByName(mortal)
            // console.log(a, m)
            a.mortal = m.uuid
            m.angel = a.uuid
        } else {
            console.error("Invalid line: " + line)
        }
    })
    return model
}

function loadCircular(content) {
    const model = new Model();
    content.split("\n").forEach(line => {
        const name = line.trim()
        if (name !== "") {
            const person = new Person().withName(name)
            model.addPerson(person)
        }
    })
    model.generateUuids()
    model.setupAMRefs()
    return model
}

async function LoadCommand(path, paired = false) {
    console.log(`Loading data from ${path}`)
    const content = fs.readFileSync(path, {encoding: "utf8"});

    return paired ? loadPaired(content) : loadCircular(content)
}

async function ListAll(model, ...args) {
    let out = ""
    out += 'userid | name | mortal\'s name | registered?\n'
    out += (model.getPeople().map(person => {
        const mortal = model.getPersonByUuid(person.mortal)
        return `${person.uuid} | ${person.name} | ${mortal.name} | ${person.isRegistered()}`
    }).join("\n"))
    if (args[0]) {
        fs.writeFileSync(args[0], out)
    } else {
        console.log(out)
    }
}

async function Dump(model) {
    console.log(model.dumpUuids())
}

module.exports = {InputHandler, LoadCommand}

