/// <reference types="cypress" />

describe('Test with backend', () => {

  beforeEach('login to application', () => {
    cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/tags', {fixture: 'tags.json'})
    cy.loginToApplication()
  })

  it('verify correct request and response', () => {

    cy.intercept('POST', 'https://conduit-api.bondaracademy.com/api/articles/').as('postArticles')
    
    cy.contains('New Article').click()
    cy.get('[formcontrolname="title"]').type('This is the title')
    cy.get('[formcontrolname="description"]').type('This is a description')
    cy.get('[formcontrolname="body"]').type('This is a body of the article')
    cy.contains('Publish Article').click()
    
    cy.wait('@postArticles').then( xhr => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(201)
      expect(xhr.request.body.article.body).to.equal('This is a body of the article')
      expect(xhr.response.body.article.description).to.equal('This is a description')
    })
  })

  it('intercepting and modifying the request and response', () => {

    // cy.intercept('POST', '**/articles/', (req)  => {
    //   req.body.article.description = "This is a description 2"
    // }).as('postArticles')
    
    cy.intercept('POST', '**/articles/', (req)  => {
      req.reply( res => {
        expect(res.body.article.description).to.equal('This is a description')
        res.body.article.description = "This is a description 2"
      })
    }).as('postArticles')
    
    cy.contains('New Article').click()
    cy.get('[formcontrolname="title"]').type('This is the title')
    cy.get('[formcontrolname="description"]').type('This is a description')
    cy.get('[formcontrolname="body"]').type('This is a body of the article')
    cy.contains('Publish Article').click()
    
    cy.wait('@postArticles').then( xhr => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(201)
      expect(xhr.request.body.article.body).to.equal('This is a body of the article')
      expect(xhr.response.body.article.description).to.equal('This is a description 2')
    })
  })

  it('verify popular tags are displayed', () => {
    cy.get('.sidebar').find('.tag-list')
    .should('contain', 'cypress')
    .and('contain', 'automation')
    .and('contain', 'testing')
  })

  it('verify global feed likes count', () => {
    cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/articles/feed*', {"articles":[],"articlesCount":0})
    cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/articles*', { fixture: 'articles.json' })

    cy.contains('Global Feed').click()
    cy.get('app-article-list button').then(heartList => {
        expect(heartList[0]).to.contain('1')
        expect(heartList[1]).to.contain('5')
    })

    cy.fixture('articles.json').then(file => {
      const articleLink = file.articles[1].slug
      file.articles[1].favoritesCount = 6
      cy.intercept('POST', 'https://conduit-api.bondaracademy.com/api/articles/'+articleLink+'/favorite', file)
    })
    
    cy.get('app-article-list button').eq(1).click().should('contain', '6')

  })

  it('delete a new article in a global feed', () => {
    
    const userCredentials = {
      "user": {
        "email": "peter-rr@test.com",
        "password": "MyPassword321"
      }
    }

    const bodyRequest = {
      "article": {
          "tagList": [],
          "title": "Request from the API",
          "description": "API testing is easy",
          "body": "Angular is cool"
        }
     }

    cy.request('POST', 'https://conduit-api.bondaracademy.com/api/users/login', userCredentials)
    .its('body').then( body => {
      const token = body.user.token

      cy.request({
        url: 'https://conduit-api.bondaracademy.com/api/articles/',
        headers: { 'Authorization': 'Token '+token},
        method: 'POST',
        body: bodyRequest
      }).then( response => {
        expect(response.status).to.equal(201)
      })

      cy.contains('Global Feed').click()
      //cy.wait(500) -> Anti-Pattern, not best practice! 
      cy.intercept('https://conduit-api.bondaracademy.com/api/articles*').as('getArticles')
      cy.wait('@getArticles')
      cy.get('.article-preview').first().click()
      cy.get('.article-actions').contains('Delete Article').click()

      cy.request({
        url: 'https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0',
        headers: { 'Authorization': 'Token '+token},
        method: 'GET'
      }).its('body').then( body => {
        expect(body.articles[0].title).not.to.equal('Request from the API')
      })
    
    })
    
  })  
 
})