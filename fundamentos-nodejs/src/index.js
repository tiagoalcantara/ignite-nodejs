const express = require('express');
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [
    {cpf: "12345678910", name: "Muffin Pimentão", id: "758f7eb2-2b2e-48a5-b8bc-946e5919bc44", statement: []}
];
/**
 * cpf - string
 * name - string
 * id - uuid
 * statement - []
 */

// Middleware
function verifyIfCustomerExists(request, response, next) {
    const { id } = request.headers;
    const customer = customers.find(customer => customer.id === id);
    if(!customer) return response.status(404).json({ error: "Customer not found"});
    request.customer = customer;
    return next();
}

function getBalance(statement) {
    return statement.reduce((acc, current) => {
        if(current.type === "credit") return acc + current.amount
        else if(current.type === "debit") return acc - current.amount
        return acc
    }, 0)
}

app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some(customer => customer.cpf === cpf);
    if(customerAlreadyExists) return response.status(400).json({error: "Customer already exists"})

    const newCustomer = {
        cpf,
        name,
        id: uuidv4(),
        statement: []
    }
    customers.push(newCustomer)
    return response.status(201).json(newCustomer)
});

app.get("/statement", verifyIfCustomerExists, (request,response) => {
    const { customer } = request;
    return response.json(customer.statement)
});

app.post("/deposit", verifyIfCustomerExists, (request, response) => {
    const { customer, body: { description, amount } } = request;
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }
    customer.statement.push(statementOperation);
    return response.status(201).json(customer);
})

app.post("/withdraw", verifyIfCustomerExists, (request, response) => {
    const { customer, body: { description, amount } } = request;
    const balance = getBalance(customer.statement);

    if(balance < amount) return response.status(400).json({ error: "Insuficient funds" })

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "debit"
    }
    customer.statement.push(statementOperation);
    return response.status(201).json(customer);
})

app.get("/statement/date", verifyIfCustomerExists, (request,response) => {
    const { customer, query: { date } } = request;

    const dateFormat = date + " 00:00"
    
    console.log(dateFormat);
    console.log(new Date(dateFormat).toDateString());
    console.log(customer.statement[0].created_at.toDateString())

    const statement = customer.statement.filter(statement => 
        statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    );

    return response.json(statement)
});

app.put("/account", verifyIfCustomerExists ,(request, response) => {
    const { customer, body: { name }} = request;
    
    customer.name = name;
    return response.json(customer)
})

app.get("/account", verifyIfCustomerExists, (request, response) => {
    const { customer } = request;
    return response.json(customer);
});

app.delete("/account", verifyIfCustomerExists, (request, response) => {
    const { customer } = request;
    customers.splice(customer, 1);
    return response.send();
});

app.get("/balance", verifyIfCustomerExists, (request, response) => {
    const { customer } = request;
    return response.json({ balance: getBalance(customer.statement)});
});

app.listen(3333);