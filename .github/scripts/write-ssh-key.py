import os
key = os.environ['SSH_KEY']
lines = [l.strip() for l in key.strip().splitlines()]
open('/home/runner/.ssh/id_ed25519', 'w').write('\n'.join(lines) + '\n')
