async function sendMessage(phoneNo, message) {
  const dataSending = {
      api_key: "9PLIFTHALSK06CW3",
      number_key: "eBm4I6xYrAiqLJTL",
      phone_no: phoneNo,
      message: message,
  };

  try {
      const response = await fetch('https://api.watzap.id/v1/send_message', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataSending)
      });

      if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.statusText);
      }

      const data = await response.json();
      console.log(data);
  } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
  }
}

export { sendMessage };