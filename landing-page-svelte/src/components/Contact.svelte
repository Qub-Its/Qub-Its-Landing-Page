<script>
  export let contactAction = "https://api.web3forms.com/submit";
</script>

<section class="contact" id="contact" aria-labelledby="contact-section">
  <div class="container">
    <h2 id="contact-section">Contact Us</h2>
    <form action={contactAction} method="POST" role="form" aria-describedby="contact-description">
      <p id="contact-description" class="sr-only">
        Please fill out the form below to get in touch with us.
      </p>
      <input type="hidden" name="access_key" value="53269194-6475-4891-a617-a0363b8ddb30" />
      <div class="field">
        <label for="name">Name</label>
        <input type="text" id="name" name="name" placeholder="Enter your name" required aria-required="true" />
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="Enter your email" required aria-required="true" />
      </div>
      <div class="field">
        <label for="message">Message</label>
        <textarea id="message" name="message" placeholder="Enter your message" rows="5" aria-multiline="true"></textarea>
      </div>
      <button type="submit" class="btn" aria-label="Send your message">Send Message</button>
    </form>
  </div>
</section>

<style>
  .contact {
    padding: 50px 20px;
    background: #f9f9f9;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
  h2 {
    text-align: center;
    margin-bottom: 20px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .field {
    display: flex;
    flex-direction: column;
  }
  label {
    margin-bottom: 5px;
    font-weight: bold;
  }
  input,
  textarea {
    padding: 10px;
    font-size: 14px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  button {
    align-self: center;
    padding: 10px 20px;
    background: #007bff;
    color: #fff;
    font-size: 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:hover {
    background: #0056b3;
  }
</style>