## error codes

1 – *message error*

    100 – Unknown message type
    101 – Message size too large or invalid fields
    102 – Failed to save the message. The message was not delivered

2 – *authentication error*

    200 – Invalid or expired token
    201 – Invalid user ID:

3 – *bundle error*

    300 – Invalid bundle fields
    301 – Bundle upload failed
    302 – Bundle fetch failed
    303 – Invalid SPK signature
    304 – Cannot fetch own bundle

4 – *contact error*

    400 – Contact not found
    401 – Cannot fetch own contact

*note: error "100" means category "1" error "00"*
