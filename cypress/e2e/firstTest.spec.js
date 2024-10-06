describe('Test with backend', () => {

  beforeEach('login to application', () => {
    cy.loginToApplication()
  })

  it('first test', () => {
    cy.log('Yaaaaay, we logged in!')
  })
})