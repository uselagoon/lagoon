# logs-tee

Send udp streams to multiple locations.

## benchmarking

```
docker network create iperf
```

In two separate terminals, start iperf servers:

```
docker run  -it --rm --name=iperf-server-0 --network iperf mlabbe/iperf -s -u
```

```
docker run  -it --rm --name=iperf-server-1 --network iperf mlabbe/iperf -s -u
```

Start the logs-tee:

```
docker build . -t logs-tee && docker run --rm -it --name=logs-tee --network iperf logs-tee 5002 iperf-server-0:5001 iperf-server-1:5001
```

Start the iperf client:

```
docker run  -it --rm --name=iperf-client --network iperf mlabbe/iperf -c logs-tee -u -p 5002 -b 100m
```

### Results

For 100Mbit UDP stream, I use 3x ~20% of a core on my laptop for each of the three `socat` processes, and no packet loss.

These results are stripped of warnings due to the unidirectional UDP flow (final packet is not acked).

#### Client

```
$ docker run  -it --rm --name=iperf-client --network iperf mlabbe/iperf -c logs-tee -u -p 5002 -b 100m
------------------------------------------------------------
Client connecting to logs-tee, UDP port 5002
Sending 1470 byte datagrams, IPG target: 117.60 us (kalman adjust)
UDP buffer size:  208 KByte (default)
------------------------------------------------------------
[  1] local 172.20.0.5 port 45881 connected with 172.20.0.4 port 5002
[ ID] Interval       Transfer     Bandwidth
[  1] 0.00-10.00 sec   119 MBytes   100 Mbits/sec
[  1] Sent 85038 datagrams
```

#### Server 0

```
$ docker run  -it --rm --name=iperf-server-0 --network iperf mlabbe/iperf -s -u
------------------------------------------------------------
Server listening on UDP port 5001
UDP buffer size:  208 KByte (default)
------------------------------------------------------------
[  1] local 172.20.0.3 port 5001 connected with 172.20.0.4 port 60655
[ ID] Interval       Transfer     Bandwidth        Jitter   Lost/Total Datagrams
[  1] 0.00-10.00 sec   119 MBytes   100 Mbits/sec   0.011 ms 0/85037 (0%)
```

#### Server 1

```
$ docker run  -it --rm --name=iperf-server-1 --network iperf mlabbe/iperf -s -u
------------------------------------------------------------
Server listening on UDP port 5001
UDP buffer size:  208 KByte (default)
------------------------------------------------------------
[  1] local 172.20.0.2 port 5001 connected with 172.20.0.4 port 59995
[ ID] Interval       Transfer     Bandwidth        Jitter   Lost/Total Datagrams
[  1] 0.00-10.00 sec   119 MBytes   100 Mbits/sec   0.014 ms 0/85037 (0%)
```
