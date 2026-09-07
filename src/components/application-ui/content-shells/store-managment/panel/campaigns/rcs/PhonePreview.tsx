'use client';

/** Preview en vivo del mensaje RCS, estilo Google Messages. Sólo lectura. */

import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { Alert, Avatar, Box, Card, Chip, Divider, Stack, Typography } from '@mui/material';
import { Btn } from './rcs-domain';
import type { RcsBuilderApi } from './use-rcs-builder';

function PreviewButtons({ buttons }: { buttons: Btn[] }) {
  const visible = buttons.filter((b) => b.text.trim());
  if (!visible.length) return null;
  return (
    <Box
      display="flex"
      gap={0.8}
      mt={1}
      overflow="auto"
      pb={0.5}
    >
      {visible.map((b, i) => (
        <Chip
          key={i}
          label={b.text}
          size="small"
          sx={{
            flexShrink: 0,
            bgcolor: '#fff',
            color: '#1a73e8',
            fontWeight: 700,
            border: '1px solid #dadce0',
          }}
        />
      ))}
    </Box>
  );
}

export default function PhonePreview({ b }: { b: RcsBuilderApi }) {
  const single = b.singleCard;

  return (
    <Box
      position={{ md: 'sticky' }}
      top={16}
    >
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        display="block"
        mb={0.5}
        textTransform="uppercase"
        letterSpacing={0.5}
      >
        Vista previa en vivo
      </Typography>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 5,
          border: '10px solid #111',
          overflow: 'hidden',
          bgcolor: '#fff',
          boxShadow: 'none',
        }}
      >
        <Box
          px={2}
          py={1.2}
          display="flex"
          alignItems="center"
          gap={1.2}
          borderBottom="1px solid #eee"
        >
          <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 14, fontWeight: 800 }}>
            S
          </Avatar>
          <Box lineHeight={1.1}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                color="#111"
              >
                Sweepstouch
              </Typography>
              <VerifiedRoundedIcon sx={{ fontSize: 14, color: '#1a73e8' }} />
            </Stack>
            <Typography
              variant="caption"
              color="#888"
            >
              Mensaje RCS · {b.storeName}
            </Typography>
          </Box>
        </Box>

        <Box
          p={1.5}
          sx={{ bgcolor: '#f6f7f9', minHeight: 200 }}
        >
          {b.msgType === 'TEXT' && (
            <Box
              bgcolor="#fff"
              borderRadius={2.5}
              border="1px solid #e4e4e7"
              p={1.5}
              maxWidth="90%"
            >
              <Typography
                variant="body2"
                color="#111"
                whiteSpace="pre-wrap"
              >
                {b.text || 'Escribí el texto del mensaje…'}
              </Typography>
            </Box>
          )}

          {b.msgType === 'FILE' && (
            <Box
              bgcolor="#fff"
              borderRadius={2.5}
              border="1px solid #e4e4e7"
              overflow="hidden"
              maxWidth="90%"
            >
              <Box
                height={140}
                sx={{
                  bgcolor: '#f1f1f1',
                  backgroundImage: (b.thumbUrl || b.fileUrl) ? `url(${b.thumbUrl || b.fileUrl})` : undefined,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <Typography
                variant="caption"
                color="#777"
                display="block"
                p={1}
                noWrap
              >
                {b.fileUrl || 'URL del archivo…'}
              </Typography>
            </Box>
          )}

          {b.msgType === 'CARD' && single && (
            <Box
              bgcolor="#fff"
              borderRadius={2.5}
              border="1px solid #e4e4e7"
              overflow="hidden"
              display={b.orientation === 'HORIZONTAL' ? 'flex' : 'block'}
              flexDirection={b.alignment === 'RIGHT' ? 'row-reverse' : 'row'}
            >
              <Box
                sx={{
                  height: b.orientation === 'HORIZONTAL' ? 'auto' : 130,
                  width: b.orientation === 'HORIZONTAL' ? 110 : '100%',
                  flexShrink: 0,
                  bgcolor: '#f1f1f1',
                  backgroundImage: single.mediaUrl ? `url(${single.mediaUrl})` : undefined,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <Box p={1.2}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="#111"
                  display="block"
                >
                  {single.title || 'Título de la card'}
                </Typography>
                <Typography
                  variant="caption"
                  color="#777"
                >
                  {single.description}
                </Typography>
                <PreviewButtons buttons={single.buttons} />
              </Box>
            </Box>
          )}
          {b.msgType === 'CARD' && !single && (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Elegí un producto o agregá una card en blanco 👆
            </Typography>
          )}

          {b.msgType === 'CAROUSEL' &&
            (b.cards.length === 0 ? (
              <Box
                py={5}
                textAlign="center"
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Elegí productos para ver el carrusel 👀
                </Typography>
              </Box>
            ) : (
              <Box
                display="flex"
                gap={1.2}
                overflow="auto"
                pb={1}
              >
                {b.cards.map((c) => (
                  <Box
                    key={c.uid}
                    flexShrink={0}
                    width={b.cardWidth === 'SMALL' ? 132 : 168}
                    bgcolor="#fff"
                    borderRadius={2.5}
                    overflow="hidden"
                    border="1px solid #e4e4e7"
                  >
                    <Box
                      height={c.mediaHeight === 'TALL' ? 140 : c.mediaHeight === 'SHORT' ? 80 : 110}
                      sx={{
                        bgcolor: '#f1f1f1',
                        backgroundImage: c.mediaUrl ? `url(${c.mediaUrl})` : undefined,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                    <Box p={1.2}>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="#111"
                        display="-webkit-box"
                        sx={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {c.title || 'Sin título'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="#777"
                        display="-webkit-box"
                        sx={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 10.5 }}
                      >
                        {c.description}
                      </Typography>
                    </Box>
                    {c.buttons.filter((x) => x.text.trim()).length > 0 && (
                      <>
                        <Divider />
                        <Box
                          py={0.8}
                          px={1}
                          textAlign="center"
                        >
                          {c.buttons
                            .filter((x) => x.text.trim())
                            .map((x, i) => (
                              <Typography
                                key={i}
                                variant="caption"
                                fontWeight={700}
                                color="#1a73e8"
                                display="block"
                                py={0.2}
                              >
                                {x.text}
                              </Typography>
                            ))}
                        </Box>
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            ))}

          <PreviewButtons buttons={b.globalButtons} />
        </Box>
      </Card>

      <Alert
        icon={false}
        severity="info"
        variant="outlined"
        sx={{ mt: 1.5 }}
      >
        El ícono 🌐 junto a los botones lo pone Google Messages según la acción — no se puede
        quitar desde la API.
      </Alert>
    </Box>
  );
}
