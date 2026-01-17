// Decode JWT from your sample code
const sampleJWT = "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtNWRkYTVhZDVlMGE4NGFiMzgzNmI0ZDZjYjNmOTUwMDAvOTAzOWQzLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3Njg1MzAxNjMsImV4cCI6MTc2ODUzNzM2MywibmJmIjoxNzY4NTMwMTU4LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtNWRkYTVhZDVlMGE4NGFiMzgzNmI0ZDZjYjNmOTUwMDAiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOmZhbHNlLCJmaWxlLXVwbG9hZCI6ZmFsc2UsIm91dGJvdW5kLWNhbGwiOmZhbHNlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOmZhbHNlLCJsaXN0LXZpc2l0b3JzIjpmYWxzZSwicmVjb3JkaW5nIjpmYWxzZSwiZmxpcCI6ZmFsc2V9LCJ1c2VyIjp7ImhpZGRlbi1mcm9tLXJlY29yZGVyIjpmYWxzZSwibW9kZXJhdG9yIjp0cnVlLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWQiOiJnb29nbGUtb2F1dGgyfDExNTA1MDk5NTczMDM1NzM5NjExNSIsImF2YXRhciI6IiIsImVtYWlsIjoidGVzdC51c2VyQGNvbXBhbnkuY29tIn19LCJyb29tIjoiKiJ9.cGOkIXY3L3g4bnNsdzZtQzRiVUtaV19MUGF1bDBKTWhjUkVEaE03bkF4UGg1a0JvS1UtLXowRnd4UFE1YzlrVWN3Wl9sV3NfeEhDcUwzT2daUVJUQktQVFZEemFVMVF1VkZZU2Rrenp4NkllaEhqRDh6T1JVSFZiRXZDV0lGekZkTURXdHJVV051RmdHVzNMUzVPWVpNZWdEY3ZpdlI0WXROZ2lfaTF3RnZqanpxUkNvVFNObkNOeE1VdklOR0pTa0ZuanlpM2RxUElLRW94ejRJbUZkeWhNR2tKVXZGWnYyRWxjY0ktdlljMW1mOWZwWU54UW43WWZMNkp0UWFsZlRfbXNCNHpPRlhYM0pSTnJPLS1lbTl3YkZ0VHFMM2ZXYmRIWllzZEYtcHd0SENDVVNJZJBNEQ0cDlTOUFJYXQ1YUtLQVR4T0htOENiRHN6S0pNX0E=";

function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('Invalid JWT format');
    return;
  }

  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

  console.log('=== Sample JWT from User ===\n');
  console.log('Header:');
  console.log(JSON.stringify(header, null, 2));
  console.log('\nPayload:');
  console.log(JSON.stringify(payload, null, 2));
}

decodeJWT(sampleJWT);
