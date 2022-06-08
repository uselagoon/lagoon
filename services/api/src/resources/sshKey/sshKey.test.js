const { Sql } = require('./sql');
const { validateSshKey } = require('./index');

describe('Sql', () => {
  describe('updateSshKey', () => {
    it('should create a proper query', () => {
      const input = {
        id: 1,
        patch: {
          keyType: 'ssh-rsa',
        },
      };
      const ret = Sql.updateSshKey(input);
      expect(ret).toMatchSnapshot();
    });
  });

  describe('selectSshKey', () => {
    it('should create a proper query', () => {
      const ret = Sql.selectSshKey(1);
      expect(ret).toMatchSnapshot();
    });
  });
});

describe('validateSshKey', () => {
  test('should return true on valid ssh key format', () => {
    const rsa_ret = validateSshKey(
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDEZlms5XsiyWjmnnUyhpt93VgHypse9Bl8kNkmZJTiM3Ex/wZAfwogzqd2LrTEiIOWSH1HnQazR+Cc9oHCmMyNxRrLkS/MEl0yZ38Q+GDfn37h/llCIZNVoHlSgYkqD0MQrhfGL5AulDUKIle93dA6qdCUlnZZjDPiR0vEXR36xGuX7QYAhK30aD2SrrBruTtFGvj87IP/0OEOvUZe8dcU9G/pCoqrTzgKqJRpqs/s5xtkqLkTIyR/SzzplO21A+pCKNax6csDDq3snS8zfx6iM8MwVfh8nvBW9seax1zBvZjHAPSTsjzmZXm4z32/ujAn/RhIkZw3ZgRKrxzryttGnWJJ8OFyF31JTJgwWWuPdH53G15PC83ZbmEgSV3win51RZRVppN4uQUuaqZWG9wwk2a6P5aen1RLCSLpTkd2mAEk9PlgmJrf8vITkiU9pF9n68ENCoo556qSdxW2pxnjrzKVPSqmqO1Xg5K4LOX4/9N4n4qkLEOiqnzzJClhFif3O28RW86RPxERGdPT81UI0oDAcU5euQr8Emz+Hd+PY1115UIld3CIHib5PYL9Ee0bFUKiWpR/acSe1fHB64mCoHP7hjFepGsq7inkvg2651wUDKBshGltpNkMj6+aZedNc0/rKYyjl80nT8g8QECgOSRzpmYp0zli2HpFoLOiWw== ansible-testing',
    );
    const ed25519_ret = validateSshKey(
      'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDHJ7msp3s6HzHv8cYRo3PCAdrg8EwjllEQyRuKTg49D',
    );
    const ecdsa_ret = validateSshKey(
      'ecdsa-sha2-nistp521 AAAAE2VjZHNhLXNoYTItbmlzdHA1MjEAAAAIbmlzdHA1MjEAAACFBAFAX0rkOBwlrXr2rJNxYVi0fRj8IiHBaFCsAM0zO+o2fh+h4EuL1Mx4F237SX5G0zuL8R6Sbf9LrY2lhKZdDpiFdgF7pP1TZ8RuDvKgasppGDEzAIm9+7bmHR118CejWF7llgHD3oz+/aRHTZVpOOaCyTGkF2oPeUejrI74KoPHk3HHpQ==',
    );
    expect(rsa_ret).toBeTruthy();
    expect(ed25519_ret).toBeTruthy();
    expect(ecdsa_ret).toBeTruthy();
  });

  test('should return false on invalid format', () => {
    expect(validateSshKey('invalid')).toBeFalsy();
    expect(validateSshKey('ssh-rsa foo')).toBeFalsy();
    expect(validateSshKey('ssh-rsa foo== comment')).toBeFalsy();
  });
});
